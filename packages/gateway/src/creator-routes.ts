import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  addEdge,
  addNode,
  analyzeRaceTelemetry,
  buildBroadcastFrames,
  buildCameraPlan,
  buildKeyframes,
  createEmptyGraph,
  generateRaceStory,
  generateRealTimeCommentary,
  getReplayFrames,
  getTtsProvider,
  loadRaceState,
  mixBroadcast,
  type AssetGraphV2,
  type Permission,
  type RaceStory,
  type TelemetryPoint,
} from '@frasberg/shared';

type PermissionGuard = (
  request: FastifyRequest,
  reply: FastifyReply,
  permission: Permission,
) => FastifyReply | undefined;

export interface AssetLicense {
  id: string;
  assetId: string;
  ownerId: string;
  priceCents: number;
  terms: string;
}

const MAX_ITEMS = 500;
// Everything below is in-memory, per ECS task, and scoped by API key id. Not durable storage.
const graphs = new Map<string, AssetGraphV2>();
const licenses: AssetLicense[] = [];
const stories = new Map<string, RaceStory>();

const owner = (request: FastifyRequest) =>
  String((request as any).authContext?.keyId ?? 'anonymous');
const storyKey = (request: FastifyRequest, raceId: string) => `${owner(request)}:${raceId}`;

function capMap<T>(map: Map<string, T>) {
  while (map.size > MAX_ITEMS) map.delete(map.keys().next().value as string);
}

export function registerCreatorRoutes(
  app: FastifyInstance,
  deps: { requirePermission: PermissionGuard },
) {
  const guard =
    (permission: Permission) =>
    async (request: FastifyRequest, reply: FastifyReply) =>
      deps.requirePermission(request, reply, permission);
  const race = (request: FastifyRequest) =>
    loadRaceState((request.params as { raceId: string }).raceId);

  app.get('/api/gt6/:raceId/mixed', { preHandler: guard('jobs:read') }, async (request, reply) => {
    const state = race(request);
    if (!state) return reply.code(404).send({ error: 'race not found' });
    const frames = buildBroadcastFrames(state);
    const audio = await generateRealTimeCommentary(frames, getTtsProvider());
    return mixBroadcast(frames, buildCameraPlan(frames), audio, frames[0]?.fusion?.videoPlan);
  });

  app.get('/api/gt6/:raceId/keyframes', { preHandler: guard('jobs:read') }, async (request, reply) => {
    const state = race(request);
    if (!state) return reply.code(404).send({ error: 'race not found' });
    return { keyframes: buildKeyframes(buildBroadcastFrames(state)) };
  });

  app.get('/api/gt6/:raceId/analytics', { preHandler: guard('jobs:read') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    if (!loadRaceState(raceId)) return reply.code(404).send({ error: 'race not found' });
    const telemetry: TelemetryPoint[] = getReplayFrames(raceId).flatMap((frame) =>
      frame.cars.map((c) => ({
        timestamp: frame.timestamp,
        carId: c.id,
        speedKph: c.speedKph,
        lap: c.lap,
        position: c.position,
      })),
    );
    return analyzeRaceTelemetry(raceId, telemetry);
  });

  app.get('/api/gt6/:raceId/story', { preHandler: guard('jobs:read') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    const saved = stories.get(storyKey(request, raceId));
    if (saved) return saved;
    const state = loadRaceState(raceId);
    if (!state) return reply.code(404).send({ error: 'race not found' });
    return generateRaceStory(buildBroadcastFrames(state));
  });

  app.put('/api/gt6/:raceId/story', { preHandler: guard('jobs:write') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    const beats = (request.body as any)?.beats;
    if (!Array.isArray(beats) || beats.some((b) => typeof b !== 'string')) {
      return reply.code(400).send({ error: 'beats must be an array of strings' });
    }
    const story: RaceStory = {
      id: `story-${Date.now()}`,
      title: `Race Story ${raceId}`,
      beats: beats.map((b: string) => b.trim()).filter(Boolean).slice(0, 200),
      highlights: [],
    };
    stories.set(storyKey(request, raceId), story);
    capMap(stories);
    return story;
  });

  app.post('/api/publish', { preHandler: guard('jobs:write') }, async (request, reply) => {
    const { mp4Url, story } = (request.body ?? {}) as { mp4Url?: string; story?: RaceStory };
    if (typeof mp4Url !== 'string' || !/^https?:\/\//i.test(mp4Url) || !story) {
      return reply.code(400).send({ error: 'http(s) mp4Url and story are required' });
    }
    const key = owner(request);
    const assetId = `asset-${Date.now()}`;
    const storyId = `${assetId}-story`;
    let graph = graphs.get(key) ?? createEmptyGraph();
    graph = addNode(graph, { id: assetId, type: 'video', url: mp4Url });
    graph = addNode(graph, { id: storyId, type: 'story', meta: { story } });
    graph = addEdge(graph, { from: assetId, to: storyId, relation: 'described_by' });
    graphs.set(key, graph);
    capMap(graphs);
    return { status: 'published', assetId, mp4Url };
  });

  app.get('/api/creator/assets', { preHandler: guard('jobs:read') }, async (request) =>
    graphs.get(owner(request)) ?? createEmptyGraph(),
  );

  app.post('/api/creator/license', { preHandler: guard('jobs:write') }, async (request, reply) => {
    const { assetId, priceCents, terms } = (request.body ?? {}) as Record<string, unknown>;
    const ownerId = owner(request);
    const known = graphs.get(ownerId)?.nodes;
    if (typeof assetId !== 'string' || !known?.[assetId]) {
      return reply.code(400).send({ error: 'assetId must be one of your published assets' });
    }
    const price = Number(priceCents ?? 0);
    if (!Number.isInteger(price) || price < 0) {
      return reply.code(400).send({ error: 'priceCents must be a non-negative integer' });
    }
    const license: AssetLicense = {
      id: `license-${Date.now()}`,
      assetId,
      ownerId,
      priceCents: price,
      terms: typeof terms === 'string' ? terms.slice(0, 2000) : '',
    };
    licenses.push(license);
    if (licenses.length > MAX_ITEMS) licenses.shift();
    return { status: 'ok', licenseId: license.id };
  });

  app.get('/api/creator/licenses', { preHandler: guard('jobs:read') }, async (request) =>
    licenses.filter((l) => l.ownerId === owner(request)),
  );
}