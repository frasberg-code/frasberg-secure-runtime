import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import {
  ApiKeyRecord,
  AuthContext,
  FrasbergDomain,
  FrasbergGateway,
  ExistentialControlPlane,
  Permission,
  authenticateRequest,
  hasPermission,
  invalidKeyResponse,
  missingPermissionResponse,
  parseApiKeys,
  validateChatRequest,
} from '@frasberg/shared';
import {
  executeEngine,
  isEngineAwareness,
  type EngineDomain,
} from '../../engine-flow/dist/engine-flow';
import { registerEmergentRoutes } from './emergent-routes';
import { registerCreatorRoutes } from './creator-routes';
import { RaceStateRepository } from './race-state-repository';
import { RuntimeAssetStore } from './runtime-asset-store';
import { DynamoRuntimeStateStore } from './runtime-state-store';
import { registerReleaseRoutes } from './release-routes';

declare module 'fastify' {
  interface FastifyRequest {
    authContext?: AuthContext;
    supabaseAccessToken?: string;
  }
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface QuotaEntry {
  tokens: number;
  updatedAt: number;
}

interface ApiQuota {
  rpm: number;
  burst: number;
}

interface GovernanceConfig {
  continuity: boolean | string;
  diagnostics: boolean | string;
  policy: {
    enabled: boolean;
    strict?: boolean;
    mode?: string;
    audit?: boolean;
  };
  membrane: { enabled: boolean; mode?: string };
  hinge: { enabled: boolean; adaptive?: boolean };
  tonal: { enabled: boolean; mode?: string };
}

export interface GatewayOptions {
  apiKeys?: ApiKeyRecord[];
  governanceAdminKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  runtimeRouterUrl?: string;
  engineServiceUrl?: string;
  frasbergGateway?: FrasbergGateway;
  fetchImpl?: typeof fetch;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  apiQuotas?: Partial<Record<FrasbergDomain, ApiQuota>>;
  runtimeStateStore?: DynamoRuntimeStateStore;
  runtimeAssetStore?: RuntimeAssetStore;
  studioRoot?: string;
}

export function buildApp(options: GatewayOptions = {}): FastifyInstance {
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiKeys =
    options.apiKeys ?? parseApiKeys(process.env.FRASBERG_API_KEYS_JSON);
  const runtimeRouterUrl = options.runtimeRouterUrl ?? 'http://127.0.0.1:4001';
  const engineServiceUrl = options.engineServiceUrl ?? 'http://127.0.0.1:4002';
  const frasbergGateway =
    options.frasbergGateway ?? FrasbergGateway.fromEnv({ fetchImpl });
  const rateLimitMax = options.rateLimitMax ?? 60;
  const rateLimitWindowMs = options.rateLimitWindowMs ?? 60_000;
  const rateLimitState = new Map<string, RateLimitEntry>();
  const quotaState = new Map<string, QuotaEntry>();
  const apiQuotas = {
    ...loadApiQuotas(),
    ...options.apiQuotas,
  };
  const governanceConfig = loadGovernanceConfig();
  const existentialControlPlane = new ExistentialControlPlane();
  const runtimeStateStore =
    options.runtimeStateStore ?? new DynamoRuntimeStateStore();
  const runtimeAssetStore =
    options.runtimeAssetStore ?? new RuntimeAssetStore();
  const raceStates = new RaceStateRepository(runtimeStateStore);

  const app = Fastify({
    logger: {
      redact: [
        'req.headers.authorization',
        'req.headers.x-api-key',
        'req.headers.x-api-signature',
        'req.headers.x-governance-key',
      ],
    },
  });
  void app.register(multipart, {
    limits: { files: 1, fileSize: 25 * 1024 * 1024 },
  });

  app.addHook('preHandler', async (request, reply) => {
    const requestPath = request.raw.url ?? '';
    const routePath = requestPath.split('?')[0] ?? requestPath;
    if (
      routePath.startsWith('/health') ||
      routePath.startsWith('/v1/health') ||
      routePath.startsWith('/runtime-health')
    ) {
      return;
    }

    const requiresSupabaseUser =
      routePath.startsWith('/v1/identity/') ||
      routePath.startsWith('/v1/continuity/') ||
      routePath === '/v1/diagnostics' ||
      routePath.startsWith('/v1/diagnostics/') ||
      routePath === '/v1/policy' ||
      routePath.startsWith('/v1/policy/');
    if (requiresSupabaseUser) {
      const limited = rateLimitRequest(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      );
      if (limited) {
        return limited;
      }
    }

    if (
      requiresSupabaseUser &&
      typeof request.headers.authorization === 'string'
    ) {
      const accessToken = readBearerToken(request.headers.authorization);
      if (accessToken) {
        let userId: string | undefined;
        try {
          userId = await resolveSupabaseUserId(
            accessToken,
            options.supabaseUrl ?? process.env.SUPABASE_URL,
            options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
            fetchImpl,
          );
        } catch (error) {
          request.log.error(
            { err: error },
            'Supabase identity authentication failed',
          );
          return reply.code(503).send({
            error: 'Identity authentication is temporarily unavailable.',
          });
        }

        if (userId) {
          request.authContext = {
            authenticated: true,
            keyId: `supabase-user:${userId}`,
            permissions: [],
            userId,
          };
          request.supabaseAccessToken = accessToken;
          return;
        }
      }
    }

    if (
      routePath.startsWith('/v1/governance/') &&
      verifyGovernanceAdminKey(
        request.headers['x-governance-key'],
        options.governanceAdminKey ?? process.env.GOVERNANCE_ADMIN_KEY,
      )
    ) {
      request.authContext = {
        authenticated: true,
        keyId: 'governance-admin-key',
        permissions: ['governance:admin'],
      };
      return;
    }

    const { context, error } = authenticateRequest(request.headers, apiKeys);
    if (error) {
      return reply.code(401).send(error);
    }

    const signature = request.headers['x-api-signature'];
    if (signature !== undefined) {
      const apiKey = readApiKeySecret(request, apiKeys);
      const body =
        request.body === undefined ? undefined : JSON.stringify(request.body);
      if (
        typeof signature !== 'string' ||
        !apiKey ||
        body === undefined ||
        !verifyRequestSignature(apiKey, signature, body)
      ) {
        return reply
          .code(403)
          .send({ error: 'Invalid API request signature.' });
      }
    }

    request.authContext = context;
  });

  app.get('/v1/health', async () => ({
    status: 'ok',
    runtimeRouterUrl,
    engineServiceUrl,
  }));

  app.get('/health', async () => ({ ok: true }));
  app.get('/runtime-health', async () => ({ ok: true }));

  const engineDomains: EngineDomain[] = [
    'identity',
    'persona',
    'character',
    'role',
    'function',
    'task',
    'action',
    'behavior',
    'pattern',
    'structure',
  ];

  for (const domain of engineDomains) {
    app.post(`/v1/${domain}`, async (request, reply) => {
      const limited = rateLimitRequest(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      );
      if (limited) {
        return limited;
      }

      const denied = requirePermission(request, reply, 'chat');
      if (denied) {
        return denied;
      }

      if (
        !isRecord(request.body) ||
        typeof request.body.input !== 'string' ||
        !isEngineAwareness(request.body.awareness)
      ) {
        return reply.code(400).send({
          error: 'Request must include a string input and valid awareness.',
        });
      }

      const result = executeEngine(
        domain,
        request.body.awareness,
        request.body.input,
      );

      return reply.code(200).send({
        version: '1.0',
        owner: request.authContext?.userId ?? request.authContext?.keyId,
        payload: result,
        timestamp: Date.now(),
      });
    });
  }

  app.get('/v1/identity/graph', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }

    try {
      return await callSupabaseRpc(
        'rpc_get_identity_graph',
        {},
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
    } catch (error) {
      request.log.error({ err: error }, 'Supabase identity graph read failed');
      return reply.code(502).send({
        error: 'Identity graph storage is temporarily unavailable.',
      });
    }
  });

  app.put('/v1/identity/graph', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }
    if (
      !isRecord(request.body) ||
      !Array.isArray(request.body.node) ||
      !Array.isArray(request.body.edges)
    ) {
      return reply.code(400).send({
        error: 'Identity graph must contain node and edges arrays.',
      });
    }

    try {
      return await callSupabaseRpc(
        'rpc_upsert_identity_graph',
        { p_node: request.body.node, p_edges: request.body.edges },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
    } catch (error) {
      request.log.error({ err: error }, 'Supabase identity graph write failed');
      return reply.code(502).send({
        error: 'Identity graph storage is temporarily unavailable.',
      });
    }
  });

  app.get('/v1/continuity/worlds/:worldId/events', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }

    const params = request.params as { worldId: string };
    const query = request.query as {
      limit?: string;
      before?: string;
      beforeId?: string;
    };
    if (!isUuid(params.worldId)) {
      return reply.code(400).send({ error: 'worldId must be a UUID.' });
    }

    const limit = query.limit === undefined ? 50 : Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return reply
        .code(400)
        .send({ error: 'limit must be between 1 and 100.' });
    }
    if (
      (query.before === undefined) !== (query.beforeId === undefined) ||
      (query.beforeId !== undefined && !isUuid(query.beforeId)) ||
      (query.before !== undefined && !Number.isFinite(Date.parse(query.before)))
    ) {
      return reply.code(400).send({ error: 'Invalid continuity cursor.' });
    }

    try {
      const result = await callSupabaseRpc(
        'rpc_list_continuity_events_page',
        {
          p_world_id: params.worldId,
          p_limit: limit,
          p_before: query.before ?? null,
          p_before_id: query.beforeId ?? null,
        },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
      if (!Array.isArray(result) || !result.every(isRecord)) {
        throw new Error('Supabase returned an invalid continuity event list.');
      }

      const events = result.map(toPublicContinuityEvent);
      const lastEvent = events.at(-1);
      return {
        events,
        nextCursor:
          events.length === limit && lastEvent
            ? { before: lastEvent.createdAt, beforeId: lastEvent.id }
            : null,
      };
    } catch (error) {
      request.log.error(
        { err: error },
        'Supabase continuity event read failed',
      );
      return reply.code(502).send({
        error: 'Continuity storage is temporarily unavailable.',
      });
    }
  });

  app.post('/v1/continuity/worlds/:worldId/events', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }

    const params = request.params as { worldId: string };
    if (!isUuid(params.worldId)) {
      return reply.code(400).send({ error: 'worldId must be a UUID.' });
    }
    if (
      !isRecord(request.body) ||
      typeof request.body.eventType !== 'string' ||
      request.body.eventType.trim().length === 0 ||
      request.body.eventType.trim().length > 100 ||
      !isRecord(request.body.payload)
    ) {
      return reply.code(400).send({
        error: 'eventType and an object payload are required.',
      });
    }

    try {
      const result = await callSupabaseRpc(
        'record_continuity_event',
        {
          p_world_id: params.worldId,
          p_event_type: request.body.eventType.trim(),
          p_payload: request.body.payload,
        },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
      if (!isRecord(result)) {
        throw new Error('Supabase returned an invalid continuity event.');
      }
      return reply.code(201).send(toPublicContinuityEvent(result));
    } catch (error) {
      request.log.error(
        { err: error },
        'Supabase continuity event write failed',
      );
      return reply.code(502).send({
        error: 'Continuity storage is temporarily unavailable.',
      });
    }
  });

  app.get('/v1/continuity/worlds/:worldId/state', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }
    const params = request.params as { worldId: string };
    if (!isUuid(params.worldId)) {
      return reply.code(400).send({ error: 'worldId must be a UUID.' });
    }

    try {
      return await callSupabaseRpc(
        'rpc_get_continuity_state',
        { p_world_id: params.worldId },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
    } catch (error) {
      request.log.error(
        { err: error },
        'Supabase continuity state read failed',
      );
      return reply.code(502).send({
        error: 'Continuity storage is temporarily unavailable.',
      });
    }
  });

  app.put('/v1/continuity/worlds/:worldId/state', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }
    const params = request.params as { worldId: string };
    if (!isUuid(params.worldId)) {
      return reply.code(400).send({ error: 'worldId must be a UUID.' });
    }
    if (!isRecord(request.body) || !isRecord(request.body.state)) {
      return reply.code(400).send({ error: 'state must be a JSON object.' });
    }

    try {
      return await callSupabaseRpc(
        'rpc_update_continuity_state',
        { p_world_id: params.worldId, p_state: request.body.state },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
    } catch (error) {
      request.log.error(
        { err: error },
        'Supabase continuity state write failed',
      );
      return reply.code(502).send({
        error: 'Continuity storage is temporarily unavailable.',
      });
    }
  });

  app.get('/v1/diagnostics', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }
    const query = request.query as {
      limit?: string;
      before?: string;
      beforeId?: string;
    };
    const limit = query.limit === undefined ? 50 : Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return reply
        .code(400)
        .send({ error: 'limit must be between 1 and 100.' });
    }
    if (
      (query.before === undefined) !== (query.beforeId === undefined) ||
      (query.beforeId !== undefined && !isUuid(query.beforeId)) ||
      (query.before !== undefined && !Number.isFinite(Date.parse(query.before)))
    ) {
      return reply.code(400).send({ error: 'Invalid diagnostics cursor.' });
    }

    try {
      const result = await callSupabaseRpc(
        'rpc_list_diagnostic_events',
        {
          p_limit: limit,
          p_before: query.before ?? null,
          p_before_id: query.beforeId ?? null,
        },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
      if (!Array.isArray(result) || !result.every(isRecord)) {
        throw new Error('Supabase returned an invalid diagnostics list.');
      }

      const events = result.map(toPublicDiagnosticEvent);
      const lastEvent = events.at(-1);
      return {
        events,
        nextCursor:
          events.length === limit && lastEvent
            ? { before: lastEvent.createdAt, beforeId: lastEvent.id }
            : null,
      };
    } catch (error) {
      request.log.error({ err: error }, 'Supabase diagnostics read failed');
      return reply.code(502).send({
        error: 'Diagnostics storage is temporarily unavailable.',
      });
    }
  });

  app.post('/v1/diagnostics', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }
    if (
      !isRecord(request.body) ||
      typeof request.body.eventType !== 'string' ||
      request.body.eventType.trim().length === 0 ||
      request.body.eventType.trim().length > 100 ||
      !isDiagnosticSeverity(request.body.severity) ||
      !isRecord(request.body.details)
    ) {
      return reply.code(400).send({
        error:
          'eventType, a supported severity, and object details are required.',
      });
    }

    try {
      const result = await callSupabaseRpc(
        'rpc_record_diagnostic_event',
        {
          p_event_type: request.body.eventType.trim(),
          p_severity: request.body.severity,
          p_details: request.body.details,
        },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
      if (!isRecord(result)) {
        throw new Error('Supabase returned an invalid diagnostic event.');
      }
      return reply.code(201).send(toPublicDiagnosticEvent(result));
    } catch (error) {
      request.log.error({ err: error }, 'Supabase diagnostics write failed');
      return reply.code(502).send({
        error: 'Diagnostics storage is temporarily unavailable.',
      });
    }
  });

  app.get('/v1/policy', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }

    try {
      const result = await callSupabaseRpc(
        'rpc_list_user_policies',
        {},
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
      if (!Array.isArray(result) || !result.every(isRecord)) {
        throw new Error('Supabase returned an invalid policy list.');
      }
      return result.map(toPublicPolicy);
    } catch (error) {
      request.log.error({ err: error }, 'Supabase policy read failed');
      return reply.code(502).send({
        error: 'Policy storage is temporarily unavailable.',
      });
    }
  });

  app.put('/v1/policy', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }
    if (
      !isRecord(request.body) ||
      (request.body.id !== undefined &&
        (typeof request.body.id !== 'string' || !isUuid(request.body.id))) ||
      typeof request.body.name !== 'string' ||
      request.body.name.trim().length === 0 ||
      request.body.name.trim().length > 100 ||
      !isUnitInterval(request.body.meaningThreshold) ||
      !isUnitInterval(request.body.riskThreshold) ||
      (request.body.enabled !== undefined &&
        typeof request.body.enabled !== 'boolean')
    ) {
      return reply.code(400).send({
        error:
          'Policy requires a name, thresholds between 0 and 1, and optional enabled flag.',
      });
    }

    try {
      const result = await callSupabaseRpc(
        'rpc_upsert_user_policy',
        {
          p_id: request.body.id ?? null,
          p_name: request.body.name.trim(),
          p_meaning_threshold: request.body.meaningThreshold,
          p_risk_threshold: request.body.riskThreshold,
          p_enabled: request.body.enabled ?? true,
        },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
      if (!isRecord(result)) {
        throw new Error('Supabase returned an invalid policy.');
      }
      return reply
        .code(request.body.id ? 200 : 201)
        .send(toPublicPolicy(result));
    } catch (error) {
      request.log.error({ err: error }, 'Supabase policy write failed');
      return reply.code(502).send({
        error: 'Policy storage is temporarily unavailable.',
      });
    }
  });

  app.delete('/v1/policy/:id', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }
    const params = request.params as { id: string };
    if (!isUuid(params.id)) {
      return reply.code(400).send({ error: 'policy id must be a UUID.' });
    }

    try {
      const deleted = await callSupabaseRpc(
        'rpc_delete_user_policy',
        { p_id: params.id },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
      if (deleted !== true) {
        return reply.code(404).send({ error: 'Policy not found.' });
      }
      return reply.code(204).send();
    } catch (error) {
      request.log.error({ err: error }, 'Supabase policy delete failed');
      return reply.code(502).send({
        error: 'Policy storage is temporarily unavailable.',
      });
    }
  });

  app.post('/v1/policy/enforce', async (request, reply) => {
    if (!request.authContext?.userId || !request.supabaseAccessToken) {
      return reply.code(401).send(invalidKeyResponse());
    }
    if (
      !isRecord(request.body) ||
      !isUnitInterval(request.body.meaningScore) ||
      !isUnitInterval(request.body.riskProfile)
    ) {
      return reply.code(400).send({
        error: 'meaningScore and riskProfile must be between 0 and 1.',
      });
    }

    try {
      return await callSupabaseRpc(
        'rpc_enforce_user_policies',
        {
          p_meaning_score: request.body.meaningScore,
          p_risk_profile: request.body.riskProfile,
        },
        request.supabaseAccessToken,
        options.supabaseUrl ?? process.env.SUPABASE_URL,
        options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
        fetchImpl,
      );
    } catch (error) {
      request.log.error({ err: error }, 'Supabase policy evaluation failed');
      return reply.code(502).send({
        error: 'Policy evaluation is temporarily unavailable.',
      });
    }
  });

  app.get('/v1/governance/status', async (request, reply) => {
    const denied = requirePermission(request, reply, 'governance:admin');
    if (denied) {
      return denied;
    }

    return {
      continuity: featureEnabled(governanceConfig.continuity),
      diagnostics: featureEnabled(governanceConfig.diagnostics),
      policy: governanceConfig.policy,
      membrane: governanceConfig.membrane,
      hinge: governanceConfig.hinge,
      tonal: governanceConfig.tonal,
      controlPlane: existentialControlPlane.getStatus(),
    };
  });

  app.get('/v1/governance/continuity', async (request, reply) => {
    const denied = requirePermission(request, reply, 'governance:admin');
    if (denied) {
      return denied;
    }
    if (!featureEnabled(governanceConfig.continuity)) {
      return reply.code(404).send({ error: 'Continuity is disabled.' });
    }

    return existentialControlPlane.getStatus();
  });

  app.post('/v1/governance/continuity', async (request, reply) => {
    const denied = requirePermission(request, reply, 'governance:admin');
    if (denied) {
      return denied;
    }
    if (!featureEnabled(governanceConfig.continuity)) {
      return reply.code(404).send({ error: 'Continuity is disabled.' });
    }

    try {
      return existentialControlPlane.simulateContinuity(
        request.body as Parameters<
          ExistentialControlPlane['simulateContinuity']
        >[0],
      );
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.post('/v1/governance/worlds', async (request, reply) => {
    const denied = requirePermission(request, reply, 'governance:admin');
    if (denied) {
      return denied;
    }

    try {
      const world = existentialControlPlane.registerWorld(
        request.body as Parameters<ExistentialControlPlane['registerWorld']>[0],
      );
      return reply.code(201).send(world);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.post('/v1/governance/policies', async (request, reply) => {
    const denied = requirePermission(request, reply, 'governance:admin');
    if (denied) {
      return denied;
    }
    if (!governanceConfig.policy.enabled) {
      return reply.code(404).send({ error: 'Policy enforcement is disabled.' });
    }

    try {
      const policy = existentialControlPlane.policyRegistry.createPolicy(
        request.body as Parameters<
          ExistentialControlPlane['policyRegistry']['createPolicy']
        >[0],
      );
      return reply.code(201).send(policy);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/governance/diagnostics', async (request, reply) => {
    const denied = requirePermission(request, reply, 'governance:admin');
    if (denied) {
      return denied;
    }
    if (!featureEnabled(governanceConfig.diagnostics)) {
      return reply.code(404).send({ error: 'Diagnostics are disabled.' });
    }

    return existentialControlPlane.getDiagnostics();
  });

  app.post('/v1/governance/policy/enforce', async (request, reply) => {
    const denied = requirePermission(request, reply, 'governance:admin');
    if (denied) {
      return denied;
    }
    if (!governanceConfig.policy.enabled) {
      return reply.code(404).send({ error: 'Policy enforcement is disabled.' });
    }

    return {
      mode: governanceConfig.policy.mode ?? 'evaluate',
      enforcement: 'evaluation-only',
      ...existentialControlPlane.runCycle(),
    };
  });

  app.post('/v1/chat/completions', async (request, reply) => {
    const limited = rateLimitRequest(
      request,
      reply,
      rateLimitState,
      rateLimitMax,
      rateLimitWindowMs,
    );
    if (limited) {
      return limited;
    }

    const denied = requirePermission(request, reply, 'chat');
    if (denied) {
      return denied;
    }

    try {
      validateChatRequest(request.body);
      return proxyJson(
        reply,
        fetchImpl,
        `${runtimeRouterUrl}/v1/chat/completions`,
        request.body,
        {
          'x-tenant-id': request.authContext?.tenantId ?? 'public',
        },
      );
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.post('/v1/completions', async (request, reply) => {
    const limited = rateLimitRequest(
      request,
      reply,
      rateLimitState,
      rateLimitMax,
      rateLimitWindowMs,
    );
    if (limited) {
      return limited;
    }

    const denied = requirePermission(request, reply, 'chat');
    if (denied) {
      return denied;
    }

    const prompt = (request.body as { prompt?: string }).prompt ?? '';
    return proxyJson(
      reply,
      fetchImpl,
      `${runtimeRouterUrl}/v1/chat/completions`,
      {
        model: 'frasberg-default',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        'x-tenant-id': request.authContext?.tenantId ?? 'public',
      },
    );
  });

  app.post('/v1/jobs', async (request, reply) => {
    const limited = rateLimitRequest(
      request,
      reply,
      rateLimitState,
      rateLimitMax,
      rateLimitWindowMs,
    );
    if (limited) {
      return limited;
    }

    const denied = requirePermission(request, reply, 'jobs:write');
    if (denied) {
      return denied;
    }

    try {
      validateChatRequest(request.body);
      return proxyJson(
        reply,
        fetchImpl,
        `${engineServiceUrl}/v1/jobs`,
        request.body,
        {
          'x-tenant-id': request.authContext?.tenantId ?? 'public',
        },
      );
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/jobs/:id', async (request, reply) => {
    const limited = rateLimitRequest(
      request,
      reply,
      rateLimitState,
      rateLimitMax,
      rateLimitWindowMs,
    );
    if (limited) {
      return limited;
    }

    const denied = requirePermission(request, reply, 'jobs:read');
    if (denied) {
      return denied;
    }

    const params = request.params as { id: string };
    return proxyRequest(
      reply,
      fetchImpl,
      `${engineServiceUrl}/v1/jobs/${params.id}`,
    );
  });

  app.get('/v1/providers/status', async (request, reply) => {
    const denied = requirePermission(request, reply, 'governance:admin');
    if (denied) {
      return denied;
    }
    return {
      checkedAt: new Date().toISOString(),
      providers: await frasbergGateway.diagnose(),
    };
  });

  app.post('/api/music', frasbergRoute('media', 'music'));
  app.post('/api/video', frasbergRoute('video', 'video'));
  app.post('/api/image', frasbergRoute('media', 'image'));
  app.post('/api/voice', frasbergRoute('media', 'voice'));
  app.post('/api/stt', frasbergRoute('stt', 'stt'));
  app.post('/api/tts', frasbergRoute('tts', 'tts'));
  app.post('/api/audio', frasbergRoute('audio', 'audio'));
  app.get('/api/jobs/:id', frasbergJobRoute());
  registerEmergentRoutes(app, {
    gateway: frasbergGateway,
    requirePermission,
    store: runtimeStateStore,
    raceStates,
    assets: runtimeAssetStore,
  });
  registerCreatorRoutes(app, {
    requirePermission,
    store: runtimeStateStore,
    raceStates,
    assets: runtimeAssetStore,
  });
  registerReleaseRoutes(app, { requirePermission, fetchImpl });

  const studioRoot = options.studioRoot ?? resolve(__dirname, 'public');
  if (existsSync(resolve(studioRoot, 'index.html'))) {
    void app.register(fastifyStatic, {
      root: studioRoot,
      prefix: '/',
      wildcard: false,
    });
    app.setNotFoundHandler((request, reply) => {
      if (
        request.method === 'GET' &&
        request.headers.accept?.includes('text/html')
      ) {
        return reply.type('text/html').sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not Found' });
    });
  }

  app.post('/v1/music/generations', frasbergRoute('media', 'music'));
  app.post('/v1/image', frasbergRoute('media', 'image'));
  app.post('/v1/voice', frasbergRoute('media', 'voice'));
  app.post('/v1/audio/generations', frasbergRoute('audio', 'audio'));
  app.post('/v1/video/generations', frasbergRoute('video', 'video'));
  app.post('/v1/audio/transcriptions', frasbergRoute('stt', 'stt'));
  app.post('/v1/audio/speech', frasbergRoute('tts', 'tts'));

  return app;

  function frasbergRoute(permission: Permission, domain: FrasbergDomain) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const limited = quotaLimitRequest(
        request,
        reply,
        quotaState,
        apiQuotas[domain],
        domain,
      );
      if (limited) {
        return limited;
      }

      const denied = requirePermission(request, reply, permission);
      if (denied) {
        return denied;
      }

      try {
        const payload =
          domain === 'stt' ? await readSttUpload(request) : request.body;
        if (domain === 'stt' && !payload) {
          return reply.code(400).send({
            error:
              'Speech-to-text requests require multipart/form-data with an audio file.',
          });
        }
        const response = await routeFrasberg(domain, payload);
        return reply.code(200).send(response);
      } catch (error) {
        return reply.code(502).send({ error: (error as Error).message });
      }
    };
  }

  function frasbergJobRoute() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const limited = rateLimitRequest(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      );
      if (limited) {
        return limited;
      }

      const denied = requirePermission(request, reply, 'jobs:read');
      if (denied) {
        return denied;
      }

      const params = request.params as { id: string };
      const query = request.query as { domain?: string };
      const parsedDomain = parseDomain(query.domain);

      try {
        const response = await frasbergGateway.job(params.id, {
          domain: parsedDomain,
        });
        return reply.code(200).send(response);
      } catch (error) {
        return reply.code(502).send({ error: (error as Error).message });
      }
    };
  }

  function routeFrasberg(domain: FrasbergDomain, payload: unknown) {
    switch (domain) {
      case 'music':
        return frasbergGateway.music(payload);
      case 'video':
        return frasbergGateway.video(payload);
      case 'image':
        return frasbergGateway.image(payload);
      case 'voice':
        return frasbergGateway.voice(payload);
      case 'stt':
        return frasbergGateway.stt(payload);
      case 'tts':
        return frasbergGateway.tts(payload);
      case 'audio':
        return frasbergGateway.audio(payload);
    }
  }

  async function readSttUpload(
    request: FastifyRequest,
  ): Promise<FormData | undefined> {
    if (!request.isMultipart()) {
      return undefined;
    }

    const file = await request.file();
    if (!file) {
      return undefined;
    }

    const contents = await file.toBuffer();
    const bytes = new Uint8Array(contents.byteLength);
    bytes.set(contents);
    const form = new FormData();
    form.append(
      'file',
      new Blob([bytes], { type: file.mimetype }),
      file.filename,
    );
    return form;
  }
}

function parseDomain(domain: string | undefined): FrasbergDomain | undefined {
  if (!domain) {
    return undefined;
  }
  const lowered = domain.toLowerCase();
  if (
    lowered === 'music' ||
    lowered === 'video' ||
    lowered === 'image' ||
    lowered === 'voice' ||
    lowered === 'stt' ||
    lowered === 'tts' ||
    lowered === 'audio'
  ) {
    return lowered;
  }
  return undefined;
}

function requirePermission(
  request: FastifyRequest,
  reply: FastifyReply,
  permission: Permission,
) {
  if (!request.authContext) {
    return reply.code(401).send(invalidKeyResponse());
  }

  if (!hasPermission(request.authContext, permission)) {
    return reply.code(403).send(missingPermissionResponse());
  }

  return undefined;
}

function readBearerToken(authorization: string): string | undefined {
  if (!authorization.startsWith('Bearer ')) {
    return undefined;
  }
  return authorization.slice('Bearer '.length).trim() || undefined;
}

async function resolveSupabaseUserId(
  accessToken: string,
  supabaseUrl: string | undefined,
  supabaseAnonKey: string | undefined,
  fetchImpl: typeof fetch,
): Promise<string | undefined> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase URL and anonymous key are required for identity.',
    );
  }

  const response = await fetchImpl(new URL('/auth/v1/user', supabaseUrl), {
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status === 401 || response.status === 403) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`Supabase Auth returned HTTP ${response.status}.`);
  }

  const user: unknown = await response.json();
  if (!isRecord(user) || typeof user.id !== 'string' || !isUuid(user.id)) {
    throw new Error('Supabase Auth returned an invalid user identity.');
  }
  return user.id;
}

async function callSupabaseRpc(
  functionName:
    | 'rpc_get_identity_graph'
    | 'rpc_upsert_identity_graph'
    | 'rpc_list_continuity_events_page'
    | 'record_continuity_event'
    | 'rpc_get_continuity_state'
    | 'rpc_update_continuity_state'
    | 'rpc_list_diagnostic_events'
    | 'rpc_record_diagnostic_event'
    | 'rpc_list_user_policies'
    | 'rpc_upsert_user_policy'
    | 'rpc_delete_user_policy'
    | 'rpc_enforce_user_policies',
  payload: Record<string, unknown>,
  accessToken: string,
  supabaseUrl: string | undefined,
  supabaseAnonKey: string | undefined,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase URL and anonymous key are required for identity.',
    );
  }

  const response = await fetchImpl(
    new URL(`/rest/v1/rpc/${functionName}`, supabaseUrl),
    {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase identity RPC returned HTTP ${response.status}.`);
  }

  return response.json();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function toPublicContinuityEvent(value: Record<string, unknown>) {
  if (
    typeof value.id !== 'string' ||
    !isUuid(value.id) ||
    typeof value.world_id !== 'string' ||
    !isUuid(value.world_id) ||
    typeof value.event_type !== 'string' ||
    !isRecord(value.payload) ||
    typeof value.created_at !== 'string' ||
    !Number.isFinite(Date.parse(value.created_at))
  ) {
    throw new Error('Supabase returned an invalid continuity event.');
  }

  return {
    id: value.id,
    worldId: value.world_id,
    eventType: value.event_type,
    payload: value.payload,
    createdAt: value.created_at,
  };
}

function toPublicDiagnosticEvent(value: Record<string, unknown>) {
  if (
    typeof value.id !== 'string' ||
    !isUuid(value.id) ||
    typeof value.event_type !== 'string' ||
    typeof value.severity !== 'string' ||
    !['info', 'warning', 'error'].includes(value.severity) ||
    !isRecord(value.details) ||
    typeof value.created_at !== 'string' ||
    !Number.isFinite(Date.parse(value.created_at))
  ) {
    throw new Error('Supabase returned an invalid diagnostic event.');
  }

  return {
    id: value.id,
    eventType: value.event_type,
    severity: value.severity,
    details: value.details,
    createdAt: value.created_at,
  };
}

function isDiagnosticSeverity(
  value: unknown,
): value is 'info' | 'warning' | 'error' {
  return value === 'info' || value === 'warning' || value === 'error';
}

function isUnitInterval(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function toPublicPolicy(value: Record<string, unknown>) {
  if (
    typeof value.id !== 'string' ||
    !isUuid(value.id) ||
    typeof value.name !== 'string' ||
    typeof value.meaning_threshold !== 'number' ||
    !isUnitInterval(value.meaning_threshold) ||
    typeof value.risk_threshold !== 'number' ||
    !isUnitInterval(value.risk_threshold) ||
    typeof value.enabled !== 'boolean' ||
    typeof value.updated_at !== 'string' ||
    !Number.isFinite(Date.parse(value.updated_at))
  ) {
    throw new Error('Supabase returned an invalid policy.');
  }

  return {
    id: value.id,
    name: value.name,
    meaningThreshold: value.meaning_threshold,
    riskThreshold: value.risk_threshold,
    enabled: value.enabled,
    updatedAt: value.updated_at,
  };
}

function verifyGovernanceAdminKey(
  suppliedKey: string | string[] | undefined,
  configuredKey: string | undefined,
): boolean {
  if (typeof suppliedKey !== 'string' || !configuredKey) {
    return false;
  }

  const suppliedBytes = Buffer.from(suppliedKey);
  const configuredBytes = Buffer.from(configuredKey);
  if (suppliedBytes.length !== configuredBytes.length) {
    return false;
  }

  return timingSafeEqual(suppliedBytes, configuredBytes);
}

function readApiKeySecret(
  request: FastifyRequest,
  apiKeys: ApiKeyRecord[],
): string | undefined {
  const apiKeyHeader = request.headers['x-api-key'];
  const authorization = request.headers.authorization;
  const presentedKey =
    typeof apiKeyHeader === 'string'
      ? apiKeyHeader
      : typeof authorization === 'string' && authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length).trim()
        : undefined;
  return apiKeys.find((candidate) => candidate.secret === presentedKey)?.secret;
}

function verifyRequestSignature(
  key: string,
  signature: string,
  body: string,
): boolean {
  if (!/^[0-9a-f]{64}$/i.test(signature)) {
    return false;
  }
  const supplied = Buffer.from(signature, 'hex');
  const expected = createHmac('sha256', key).update(body, 'utf8').digest();
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}

function rateLimitRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  state: Map<string, RateLimitEntry>,
  max: number,
  windowMs: number,
) {
  if (
    consumeRateLimit(
      state,
      `${request.ip}:${request.routeOptions.url}`,
      max,
      windowMs,
    )
  ) {
    return undefined;
  }

  return reply.code(429).send({
    error: {
      code: 'FK-429',
      message: 'Too many requests.',
    },
  });
}

function quotaLimitRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  state: Map<string, QuotaEntry>,
  quota: ApiQuota,
  domain: FrasbergDomain,
) {
  const key = `${request.authContext?.tenantId ?? request.authContext?.keyId ?? request.ip}:${domain}`;
  const now = Date.now();
  const current = state.get(key) ?? {
    tokens: quota.burst,
    updatedAt: now,
  };
  const elapsed = Math.max(0, now - current.updatedAt);
  current.tokens = Math.min(
    quota.burst,
    current.tokens + (elapsed * quota.rpm) / 60_000,
  );
  current.updatedAt = now;

  if (current.tokens < 1) {
    state.set(key, current);
    const retryAfter = Math.max(
      1,
      Math.ceil(((1 - current.tokens) * 60) / quota.rpm),
    );
    reply.header('retry-after', retryAfter);
    return reply.code(429).send({
      error: {
        code: 'FK-429',
        message: 'Too many requests.',
      },
    });
  }

  current.tokens -= 1;
  state.set(key, current);
  return undefined;
}

function loadApiQuotas(): Record<FrasbergDomain, ApiQuota> {
  const path = resolve(process.cwd(), 'config/api-quotas.json');
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isRecord(parsed)) {
    throw new Error(`API quota configuration at "${path}" must be an object.`);
  }

  return {
    music: readApiQuota(parsed.music, 'music'),
    video: readApiQuota(parsed.video, 'video'),
    image: readApiQuota(parsed.image, 'image'),
    voice: readApiQuota(parsed.voice, 'voice'),
    stt: readApiQuota(parsed.stt, 'stt'),
    tts: readApiQuota(parsed.tts, 'tts'),
    audio: readApiQuota(parsed.audio, 'audio'),
  };
}

function loadGovernanceConfig(): GovernanceConfig {
  const filename =
    process.env.NODE_ENV === 'production'
      ? 'config/governance-production.json'
      : 'config/governance.json';
  const path = resolve(process.cwd(), filename);
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (
    !isRecord(parsed) ||
    !isFeatureFlag(parsed.continuity) ||
    !isFeatureFlag(parsed.diagnostics) ||
    !isRecord(parsed.policy) ||
    typeof parsed.policy.enabled !== 'boolean' ||
    !isFeatureFlagObject(parsed.membrane) ||
    !isFeatureFlagObject(parsed.hinge) ||
    !isFeatureFlagObject(parsed.tonal)
  ) {
    throw new Error(`Governance configuration at "${path}" is invalid.`);
  }

  return parsed as unknown as GovernanceConfig;
}

function readApiQuota(value: unknown, domain: string): ApiQuota {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.rpm) ||
    !isPositiveInteger(value.burst)
  ) {
    throw new Error(
      `API quota for "${domain}" must have positive integer rpm and burst values.`,
    );
  }
  return { rpm: value.rpm, burst: value.burst };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isFeatureFlag(value: unknown): value is boolean | string {
  return typeof value === 'boolean' || typeof value === 'string';
}

function isFeatureFlagObject(
  value: unknown,
): value is Record<string, unknown> & { enabled: boolean } {
  return isRecord(value) && typeof value.enabled === 'boolean';
}

function featureEnabled(value: boolean | string): boolean {
  return (
    value === true ||
    (typeof value === 'string' &&
      value.trim().length > 0 &&
      value.toLowerCase() !== 'disabled')
  );
}

function consumeRateLimit(
  state: Map<string, RateLimitEntry>,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const current = state.get(key);

  if (!current || current.resetAt <= now) {
    state.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= max) {
    return false;
  }

  current.count += 1;
  return true;
}

async function proxyJson(
  reply: FastifyReply,
  fetchImpl: typeof fetch,
  url: string,
  payload: unknown,
  headers: Record<string, string> = {},
) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  return reply.code(response.status).send(body);
}

async function proxyRequest(
  reply: FastifyReply,
  fetchImpl: typeof fetch,
  url: string,
) {
  const response = await fetchImpl(url, { method: 'GET' });
  const body = await response.json();
  return reply.code(response.status).send(body);
}
