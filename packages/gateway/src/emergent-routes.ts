import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  EmergentAgentLoop,
  EmergentAgentRuntime,
  WorldgraphClient,
  buildBroadcastFrames,
  buildCinematicSequence,
  buildExportBundle,
  enqueueBroadcastToVideo,
  generateDirectorsCut,
  generateVoiceOver,
  getBroadcastToVideoStatus,
  getEmergentJob,
  getModelUsageSummary,
  getReplayFrames,
  getTimelineForJob,
  listEmergentJobs,
  loadRaceState,
  type FrasbergGateway,
  type Permission,
  type RuntimeJob,
} from '@frasberg/shared';

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
  deps: { gateway: FrasbergGateway; requirePermission: PermissionGuard },
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
      return await loop.execute({
        permissions: {},
        maxCostWeight: 5,
        ...body,
        raceConfig: { cars: [], driverProfiles: [], lapCount: 1, ...body.raceConfig },
      });
    } catch (error) {
      return reply.code(500).send({ error: (error as Error).message });
    }
  });

  app.get('/api/emergent/jobs', { preHandler: guard('jobs:read') }, async () => ({
    jobs: listEmergentJobs().map(({ payload, multimodal, ...summary }) => summary),
  }));

  app.get(
    '/api/emergent/jobs/:id',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const job = getEmergentJob((request.params as { id: string }).id);
      return job ? job : reply.code(404).send({ error: 'not found' });
    },
  );

  app.get(
    '/api/emergent/jobs/:id/timeline',
    { preHandler: guard('jobs:read') },
    async (request) => ({
      events: getTimelineForJob((request.params as { id: string }).id),
    }),
  );

  app.get('/api/analytics/models', { preHandler: guard('jobs:read') }, async () =>
    getModelUsageSummary(),
  );

  app.get(
    '/api/gt6/replay/:raceId',
    { preHandler: guard('jobs:read') },
    async (request) => ({
      frames: getReplayFrames((request.params as { raceId: string }).raceId),
    }),
  );

  app.get(
    '/api/gt6/:raceId/cinematic',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const state = loadRaceState((request.params as { raceId: string }).raceId);
      if (!state) return reply.code(404).send({ error: 'race not found' });
      return { shots: buildCinematicSequence(state) };
    },
  );

  const raceFor = (request: FastifyRequest) =>
    loadRaceState((request.params as { raceId: string }).raceId);

  app.get(
    '/api/gt6/:raceId/broadcast',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const state = raceFor(request);
      if (!state) return reply.code(404).send({ error: 'race not found' });
      return { frames: buildBroadcastFrames(state) };
    },
  );

  app.get(
    '/api/gt6/:raceId/live',
    { preHandler: guard('jobs:read') },
    async (request, reply) => {
      const state = raceFor(request);
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
      const state = raceFor(request);
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
      if (!raceFor(request)) {
        return reply.code(404).send({ error: 'race not found' });
      }
      const jobId = enqueueBroadcastToVideo(
        (request.params as { raceId: string }).raceId,
      );
      return reply.code(202).send({ jobId, status: 'queued' });
    },
  );

  app.get(
    '/api/exports/:jobId/status',
    { preHandler: guard('jobs:read') },
    async (request) =>
      getBroadcastToVideoStatus((request.params as { jobId: string }).jobId),
  );
}