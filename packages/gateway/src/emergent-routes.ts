import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  EmergentAgentLoop,
  EmergentAgentRuntime,
  WorldgraphClient,
  buildBroadcastFrames,
  buildCinematicSequence,
  buildExportBundle,
  generateDirectorsCut,
  generateVoiceOver,
  getEmergentJob,
  getTimelineForJob,
  listEmergentJobs,
  type FrasbergGateway,
  type Permission,
  type RuntimeJob,
} from '@frasberg/shared';
import { enqueueExport, getExportStatus } from './export-jobs';
import { RaceStateRepository } from './race-state-repository';
import { RuntimeAssetStore } from './runtime-asset-store';
import type { RuntimeStateStore } from './runtime-state-store';

type PermissionGuard = (
  request: FastifyRequest,
  reply: FastifyReply,
  permission: Permission,
) => FastifyReply | undefined;

// Calls the in-process Frasberg gateway so emergentAgent never hits provider endpoints directly.
class InProcessRuntime extends EmergentAgentRuntime {
  constructor(private readonly gateway: FrasbergGateway) {
    super('', '');
  }

  override async call(path: string, payload: any): Promise<RuntimeJob> {
    try {
      const response: any = await this.dispatch(path, payload);
      return {
        jobId: String(response?.jobId ?? response?.task_id ?? response?.id ?? 'sync'),
        status: response?.status ?? 'completed',
        result: response,
      };
    } catch (error) {
      return { jobId: 'none', status: 'failed', error: (error as Error).message };
    }
  }

  private dispatch(path: string, payload: any) {
    switch (path) {
      case '/api/video':
        return this.gateway.video(payload);
      case '/api/music':
        return this.gateway.music(payload);
      case '/api/image':
        return this.gateway.image(payload);
      case '/api/voice':
        return this.gateway.tts({ text: payload?.text, voice: payload?.voiceId });
      case '/api/tts':
        return this.gateway.tts({ text: payload?.text, voice: payload?.voiceId });
      case '/api/audio':
        return this.gateway.audio(payload);
      default:
        throw new Error(`Unsupported runtime path ${path}`);
    }
  }
}

// Worldgraph updates are applied through the gateway's own /v1/worldgraph routes when requested.
class NoopWorldgraph extends WorldgraphClient {
  constructor() {
    super('', '');
  }
  override async update() {
    return {};
  }
  override async get() {
    return null;
  }
}

export function registerEmergentRoutes(
  app: FastifyInstance,
  deps: {
    gateway: FrasbergGateway;
    requirePermission: PermissionGuard;
    store: RuntimeStateStore;
    raceStates: RaceStateRepository;
    assets: RuntimeAssetStore;
  },
) {
  const loop = new EmergentAgentLoop(
    new InProcessRuntime(deps.gateway),
    new NoopWorldgraph(),
  );
  const guard =
    (permission: Permission) =>
    async (request: FastifyRequest, reply: FastifyReply) =>
      deps.requirePermission(request, reply, permission);

  app.post('/api/emergent', { preHandler: guard('video') }, async (request, reply) => {
    const body = request.body as any;
    if (!body?.raceConfig?.raceId || !body?.intent) {
      return reply
        .code(400)
        .send({ error: 'intent and raceConfig.raceId are required.' });
    }
    try {
      const result = await loop.execute({
        permissions: {},
        maxCostWeight: 5,
        ...body,
        raceConfig: { cars: [], driverProfiles: [], lapCount: 1, ...body.raceConfig },
      });
      await deps.raceStates.save(result.raceState);
      const job = getEmergentJob(result.jobId);
      if (job) {
        const ownerId = String(
          (request as FastifyRequest & { authContext?: { keyId?: string } })
            .authContext?.keyId ?? 'anonymous',
        );
        const pk = `OWNER#${ownerId}`;
        await deps.store.put({
          pk,
          sk: `EMERGENTJOB#${job.id}`,
          kind: 'emergent-job',
          value: job,
        });
        await deps.store.put({
          pk,
          sk: `EMERGENT#${String(job.createdAt).padStart(16, '0')}#${job.id}`,
          kind: 'emergent-job-index',
          value: { id: job.id, createdAt: job.createdAt },
        });
        await deps.store.put({
          pk,
          sk: `MODELUSAGE#${String(job.createdAt).padStart(16, '0')}#${job.id}`,
          kind: 'model-usage',
          value: {
            provider: result.modelChoice.provider,
            model: result.modelChoice.model,
            task: 'video',
            timestamp: job.createdAt,
          },
        });
        for (const event of getTimelineForJob(job.id)) {
          await deps.store.put({
            pk,
            sk: `TIMELINE#${job.id}#${String(event.timestamp).padStart(16, '0')}#${event.id}`,
            kind: 'emergent-timeline',
            value: event,
          });
        }
      }
      return result;
    } catch (error) {
      return reply.code(500).send({ error: (error as Error).message });
    }
  });

  app.get('/api/emergent/jobs', { preHandler: guard('jobs:read') }, async (request) => {
    const ownerId = String(
      (request as FastifyRequest & { authContext?: { keyId?: string } })
        .authContext?.keyId ?? 'anonymous',
    );
    const records = await deps.store.query(`OWNER#${ownerId}`, {
      skPrefix: 'EMERGENT#',
      descending: true,
      limit: 200,
    });
    const jobs = await Promise.all(
      records.map(async (record) => {
        const jobId = (record.value as { id: string }).id;
        const jobRecord = await deps.store.get(
          `OWNER#${ownerId}`,
          `EMERGENTJOB#${jobId}`,
        );
        const job = jobRecord?.value as ReturnType<typeof getEmergentJob>;
        if (!job) return undefined;
        const { payload, multimodal, ...summary } = job;
        return summary;
      }),
    );
    return { jobs: jobs.filter((job) => job !== undefined) };
  });

  app.get(
    '/api/emergent/jobs/:id',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const ownerId = String(
        (request as FastifyRequest & { authContext?: { keyId?: string } })
          .authContext?.keyId ?? 'anonymous',
      );
      const record = await deps.store.get(
        `OWNER#${ownerId}`,
        `EMERGENTJOB#${(request.params as { id: string }).id}`,
      );
      return record?.kind === 'emergent-job'
        ? record.value
        : reply.code(404).send({ error: 'not found' });
    },
  );

  app.get(
    '/api/emergent/jobs/:id/timeline',
    { preHandler: guard('jobs:read') },
    async (request) => {
      const ownerId = String(
        (request as FastifyRequest & { authContext?: { keyId?: string } })
          .authContext?.keyId ?? 'anonymous',
      );
      const id = (request.params as { id: string }).id;
      const records = await deps.store.query(`OWNER#${ownerId}`, {
        skPrefix: `TIMELINE#${id}#`,
      });
      return {
        events: records.map((record) => record.value),
      };
    },
  );

  app.get('/api/analytics/models', { preHandler: guard('jobs:read') }, async (request) => {
    const ownerId = String(
      (request as FastifyRequest & { authContext?: { keyId?: string } })
        .authContext?.keyId ?? 'anonymous',
    );
    const records = await deps.store.query(`OWNER#${ownerId}`, {
      skPrefix: 'MODELUSAGE#',
      limit: 10_000,
    });
    const summary = {
      byModel: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
      byTask: {} as Record<string, number>,
    };
    for (const record of records) {
      const usage = record.value as {
        provider: string;
        model: string;
        task: string;
      };
      const model = `${usage.provider}:${usage.model}`;
      summary.byModel[model] = (summary.byModel[model] ?? 0) + 1;
      summary.byProvider[usage.provider] = (summary.byProvider[usage.provider] ?? 0) + 1;
      summary.byTask[usage.task] = (summary.byTask[usage.task] ?? 0) + 1;
    }
    return summary;
  });

  app.get(
    '/api/gt6/replay/:raceId',
    { preHandler: guard('jobs:read') },
    async (request) => ({
      frames: await deps.raceStates.replayFrames(
        (request.params as { raceId: string }).raceId,
      ),
    }),
  );

  app.get(
    '/api/gt6/:raceId/cinematic',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const state = await deps.raceStates.load(
        (request.params as { raceId: string }).raceId,
      );
      if (!state) return reply.code(404).send({ error: 'race not found' });
      return { shots: buildCinematicSequence(state) };
    },
  );

  const raceFor = (request: FastifyRequest) =>
    deps.raceStates.load((request.params as { raceId: string }).raceId);

  app.get(
    '/api/gt6/:raceId/broadcast',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const state = await raceFor(request);
      if (!state) return reply.code(404).send({ error: 'race not found' });
      return { frames: buildBroadcastFrames(state) };
    },
  );

  app.get(
    '/api/gt6/:raceId/live',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const state = await raceFor(request);
      if (!state) return reply.code(404).send({ error: 'race not found' });
      const frames = buildBroadcastFrames(state);
      return {
        raceId: state.raceId,
        status: 'ready',
        frames,
        voiceOver: generateVoiceOver(frames),
      };
    },
  );

  app.get(
    '/api/gt6/:raceId/export',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const state = await raceFor(request);
      if (!state) return reply.code(404).send({ error: 'race not found' });
      const frames = buildBroadcastFrames(state);
      return {
        bundle: buildExportBundle(frames),
        directorsCut: generateDirectorsCut(frames),
      };
    },
  );

  app.post(
    '/api/gt6/:raceId/export/mp4',
    { preHandler: guard('video') },
    async (request, reply) => {
      const raceId = (request.params as { raceId: string }).raceId;
      const state = await raceFor(request);
      if (!state) {
        return reply.code(404).send({ error: 'race not found' });
      }
      const ownerId = String(
        (request as FastifyRequest & { authContext?: { keyId?: string } })
          .authContext?.keyId ?? 'anonymous',
      );
      const jobId = await enqueueExport(
        deps.store,
        deps.assets,
        ownerId,
        raceId,
        state,
      );
      return reply.code(202).send({ jobId, status: 'queued' });
    },
  );

  app.get(
    '/api/exports/:jobId/status',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const ownerId = String(
        (request as FastifyRequest & { authContext?: { keyId?: string } })
          .authContext?.keyId ?? 'anonymous',
      );
      const status = await getExportStatus(
        deps.store,
        deps.assets,
        ownerId,
        (request.params as { jobId: string }).jobId,
      );
      return status ?? reply.code(404).send({ error: 'export not found' });
    },
  );
}