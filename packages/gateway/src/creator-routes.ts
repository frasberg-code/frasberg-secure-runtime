import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  addEdge,
  addNode,
  analyzeRaceTelemetry,
  buildBroadcastFrames,
  buildCameraPlan,
  buildCinematicSequence,
  buildKeyframes,
  createEmptyGraph,
  generateRaceStory,
  generateRealTimeCommentary,
  getReplayFrames,
  getTtsProvider,
  mixBroadcast,
  type AssetGraphV2,
  type Permission,
  type RaceStory,
  type TelemetryPoint,
} from '@frasberg/shared';
import { RaceStateRepository } from './race-state-repository';
import { enqueueExport } from './export-jobs';
import type { RuntimeAssetStore } from './runtime-asset-store';
import type { RuntimeStateStore } from './runtime-state-store';

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

const CAMERAS = ['static_track', 'chase_cam', 'cockpit', 'drone'];
const MAX_ITEMS = 500;
const owner = (request: FastifyRequest) =>
  String((request as FastifyRequest & { authContext?: { keyId?: string } }).authContext?.keyId ?? 'anonymous');
const ownerPartition = (ownerId: string) => `OWNER#${ownerId}`;
const storyKey = (raceId: string) => `STORY#${raceId}`;
const cameraKey = (raceId: string) => `CAMERA#${raceId}`;

export function registerCreatorRoutes(
  app: FastifyInstance,
  deps: {
    requirePermission: PermissionGuard;
    store: RuntimeStateStore;
    raceStates: RaceStateRepository;
    assets: RuntimeAssetStore;
  },
) {
  const guard =
    (permission: Permission) =>
    async (request: FastifyRequest, reply: FastifyReply) =>
      deps.requirePermission(request, reply, permission);
  const race = (request: FastifyRequest) =>
    deps.raceStates.load((request.params as { raceId: string }).raceId);

  app.get('/api/gt6/:raceId/mixed', { preHandler: guard('jobs:read') }, async (request, reply) => {
    const state = await race(request);
    if (!state) return reply.code(404).send({ error: 'race not found' });
    const frames = buildBroadcastFrames(state);
    const audio = await generateRealTimeCommentary(frames, getTtsProvider());
    return mixBroadcast(frames, buildCameraPlan(frames), audio, frames[0]?.fusion?.videoPlan);
  });

  app.get('/api/gt6/:raceId/keyframes', { preHandler: guard('jobs:read') }, async (request, reply) => {
    const state = await race(request);
    if (!state) return reply.code(404).send({ error: 'race not found' });
    return { keyframes: buildKeyframes(buildBroadcastFrames(state)) };
  });

  app.post('/api/ai/cinematic/:raceId', { preHandler: guard('video') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    const state = await race(request);
    if (!state) return reply.code(404).send({ error: 'race not found' });
    const frames = buildBroadcastFrames(state);
    const shots = buildCinematicSequence(state);
    return {
      mode: 'deterministic-gt6-planner',
      summary: `Generated a rule-based plan with ${shots.length} shots for ${raceId}. This is not an ML inference.`,
      shots,
      cameraPlan: buildCameraPlan(frames),
      keyframes: buildKeyframes(frames),
    };
  });

  app.post('/api/gt6/:raceId/automation', { preHandler: guard('video') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    const state = await race(request);
    if (!state) return reply.code(404).send({ error: 'race not found' });
    const frames = buildBroadcastFrames(state);
    const audioTrack = await generateRealTimeCommentary(frames, getTtsProvider());
    const cameraPlan = buildCameraPlan(frames);
    const ownerId = owner(request);
    const exportJobId = await enqueueExport(
      deps.store,
      deps.assets,
      ownerId,
      raceId,
      state,
    );
    return {
      mode: 'rule-based',
      frames,
      cameraPlan,
      commentary: audioTrack,
      exportJobId,
      note: 'The export is a metadata title card; it does not contain rendered GT6 footage or mixed commentary audio.',
    };
  });

  app.get('/api/gt6/:raceId/analytics', { preHandler: guard('jobs:read') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    if (!(await race(request))) return reply.code(404).send({ error: 'race not found' });
    const telemetry: TelemetryPoint[] = (await deps.raceStates.replayFrames(raceId)).flatMap((frame) =>
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
    const existing = await deps.store.get(ownerPartition(owner(request)), storyKey(raceId));
    if (existing?.kind === 'race-story') return existing.value;
    const state = await race(request);
    if (!state) return reply.code(404).send({ error: 'race not found' });
    return generateRaceStory(buildBroadcastFrames(state));
  });

  app.put('/api/gt6/:raceId/story', { preHandler: guard('jobs:write') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    const beats = (request.body as { beats?: unknown })?.beats;
    if (!Array.isArray(beats) || beats.length > 200 || beats.some((b) => typeof b !== 'string')) {
      return reply.code(400).send({ error: 'beats must be an array of at most 200 strings' });
    }
    const story: RaceStory = {
      id: `story-${randomUUID()}`,
      title: `Race Story ${raceId}`,
      beats: beats.map((b) => b.trim()).filter(Boolean),
      highlights: [],
    };
    await deps.store.put({
      pk: ownerPartition(owner(request)),
      sk: storyKey(raceId),
      kind: 'race-story',
      value: story,
    });
    return story;
  });

  app.post('/api/gt6/:raceId/camera', { preHandler: guard('jobs:write') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    if (!(await race(request))) return reply.code(404).send({ error: 'race not found' });
    const camera = (request.body as { camera?: unknown })?.camera;
    if (typeof camera !== 'string' || !CAMERAS.includes(camera)) {
      return reply.code(400).send({ error: `camera must be one of ${CAMERAS.join(', ')}` });
    }
    await deps.store.put({
      pk: ownerPartition(owner(request)),
      sk: cameraKey(raceId),
      kind: 'camera',
      value: camera,
    });
    return { raceId, camera };
  });

  app.get('/api/gt6/:raceId/camera', { preHandler: guard('jobs:read') }, async (request, reply) => {
    const raceId = (request.params as { raceId: string }).raceId;
    if (!(await race(request))) return reply.code(404).send({ error: 'race not found' });
    const result = await deps.store.get(ownerPartition(owner(request)), cameraKey(raceId));
    return { raceId, camera: result?.kind === 'camera' ? result.value : 'static_track' };
  });

  app.post('/api/publish', { preHandler: guard('jobs:write') }, async (request, reply) => {
    const { mp4Url, story } = (request.body ?? {}) as { mp4Url?: unknown; story?: unknown };
    if (
      typeof mp4Url !== 'string' ||
      !/^https?:\/\//i.test(mp4Url) ||
      !story ||
      typeof story !== 'object' ||
      !Array.isArray((story as RaceStory).beats)
    ) {
      return reply.code(400).send({ error: 'http(s) mp4Url and a valid story are required' });
    }
    const ownerId = owner(request);
    const pk = ownerPartition(ownerId);
    const assetId = `asset-${randomUUID()}`;
    const storyId = `${assetId}-story`;
    let graph: AssetGraphV2 = createEmptyGraph();
    graph = addNode(graph, { id: assetId, type: 'video', url: mp4Url });
    graph = addNode(graph, { id: storyId, type: 'story', meta: { story } });
    graph = addEdge(graph, { from: assetId, to: storyId, relation: 'described_by' });
    await deps.store.put({ pk, sk: `ASSET#${assetId}`, kind: 'asset', value: graph.nodes[assetId] });
    await deps.store.put({ pk, sk: `ASSET#${storyId}`, kind: 'asset', value: graph.nodes[storyId] });
    await deps.store.put({
      pk,
      sk: `EDGE#${assetId}#described_by#${storyId}`,
      kind: 'asset-edge',
      value: graph.edges[0],
    });
    return { status: 'published', assetId, mp4Url };
  });

  app.get('/api/creator/assets', { preHandler: guard('jobs:read') }, async (request) => {
    const pk = ownerPartition(owner(request));
    const records = [
      ...(await deps.store.query(pk, { skPrefix: 'ASSET#', limit: MAX_ITEMS })),
      ...(await deps.store.query(pk, { skPrefix: 'EDGE#', limit: MAX_ITEMS })),
    ];
    let graph = createEmptyGraph();
    for (const record of records) {
      if (record.kind === 'asset') graph = addNode(graph, record.value as AssetGraphV2['nodes'][string]);
      if (record.kind === 'asset-edge') graph = addEdge(graph, record.value as AssetGraphV2['edges'][number]);
    }
    return graph;
  });

  app.post('/api/creator/license', { preHandler: guard('jobs:write') }, async (request, reply) => {
    const { assetId, priceCents, terms } = (request.body ?? {}) as Record<string, unknown>;
    const ownerId = owner(request);
    const asset = typeof assetId === 'string'
      ? await deps.store.get(ownerPartition(ownerId), `ASSET#${assetId}`)
      : undefined;
    if (asset?.kind !== 'asset') {
      return reply.code(400).send({ error: 'assetId must be one of your published assets' });
    }
    const price = Number(priceCents ?? 0);
    if (!Number.isInteger(price) || price < 0) {
      return reply.code(400).send({ error: 'priceCents must be a non-negative integer' });
    }
    const license: AssetLicense = {
      id: `license-${randomUUID()}`,
      assetId: assetId as string,
      ownerId,
      priceCents: price,
      terms: typeof terms === 'string' ? terms.slice(0, 2000) : '',
    };
    await deps.store.put({
      pk: ownerPartition(ownerId),
      sk: `LICENSE#${license.id}`,
      kind: 'asset-license',
      value: license,
    });
    return { status: 'ok', licenseId: license.id };
  });

  app.get('/api/creator/licenses', { preHandler: guard('jobs:read') }, async (request) => {
    const records = await deps.store.query(ownerPartition(owner(request)), {
      skPrefix: 'LICENSE#',
      limit: MAX_ITEMS,
    });
    return records.map((record) => record.value as AssetLicense);
  });
}
