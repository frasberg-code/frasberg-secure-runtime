import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import {
  ChatCompletionRequest,
  InMemoryJobRepository,
  JobRecord,
} from '@frasberg/shared';
import { unifiedEnforce } from './unified-enforce';

export interface EngineOptions {
  jobRepository?: InMemoryJobRepository;
  processDelayMs?: number;
}

export class JobService {
  constructor(
    private readonly jobs: InMemoryJobRepository,
    private readonly processDelayMs = 0,
  ) {}

  enqueue(payload: ChatCompletionRequest, tenantId = 'public'): JobRecord {
    const job = this.jobs.create({
      tenantId,
      state: 'queued',
      request: payload,
    });

    setTimeout(() => {
      this.start(job.id);
      try {
        const result = buildCompletion(payload);
        this.complete(job.id, result);
      } catch (error) {
        this.fail(
          job.id,
          error instanceof Error ? error.message : 'Unknown job failure',
        );
      }
    }, this.processDelayMs);

    return job;
  }

  start(id: string): JobRecord | undefined {
    return this.jobs.update(id, (job) => ({ ...job, state: 'running' }));
  }

  complete(id: string, result: unknown): JobRecord | undefined {
    return this.jobs.update(id, (job) => ({
      ...job,
      state: 'completed',
      result,
    }));
  }

  fail(id: string, error: string): JobRecord | undefined {
    return this.jobs.update(id, (job) => ({ ...job, state: 'failed', error }));
  }

  get(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }
}

export function buildCompletion(payload: ChatCompletionRequest) {
  const prompt = payload.messages[payload.messages.length - 1]?.content ?? '';
  return {
    id: 'cmpl-dev',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: payload.model ?? 'frasberg-default',
    choices: [
      {
        index: 0,
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: `Frasberg scaffold response: ${prompt}`,
        },
      },
    ],
  };
}

export function buildApp(options: EngineOptions = {}): FastifyInstance {
  const jobs = options.jobRepository ?? new InMemoryJobRepository(100);
  const service = new JobService(jobs, options.processDelayMs ?? 0);
  const app = Fastify({ logger: false });

  app.addHook('preHandler', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  app.get('/v1/health', async () => ({
    status: 'ok',
    storage: 'in-memory-dev',
  }));

  app.post('/v1/generations/chat', async (request, reply) => {
    try {
      const payload = unifiedEnforce(
        service,
        readOwnerId(request.headers),
        {
          continuity: request.headers['x-continuity-id'],
          requestId: request.id,
          policy: request.body,
        },
      );
      return buildCompletion(payload);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.post('/v1/jobs', async (request, reply) => {
    try {
      const ownerId = readOwnerId(request.headers);
      const payload = unifiedEnforce(service, ownerId, {
        continuity: request.headers['x-continuity-id'],
        requestId: request.id,
        policy: request.body,
      });
      const job = service.enqueue(payload, ownerId);
      return reply.code(202).send(job);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/jobs/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const job = service.get(params.id);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found.' });
    }
    return job;
  });

  return app;
}

function readOwnerId(
  headers: FastifyRequest['headers'],
): string {
  const ownerId = headers['x-tenant-id'] ?? headers['x-owner-id'] ?? 'public';
  if (typeof ownerId !== 'string') {
    throw new Error('Owner identity must be a single string.');
  }
  return ownerId.trim();
}
