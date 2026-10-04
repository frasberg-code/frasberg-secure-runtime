import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
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

  const app = Fastify({
    logger: {
      redact: [
        'req.headers.authorization',
        'req.headers.x-api-key',
        'req.headers.x-governance-key',
      ],
    },
  });

  app.addHook('preHandler', async (request, reply) => {
    const requestPath = request.raw.url ?? '';
    if (
      requestPath.startsWith('/health') ||
      requestPath.startsWith('/v1/health') ||
      requestPath.startsWith('/runtime-health')
    ) {
      return;
    }

    const requiresSupabaseUser =
      requestPath.startsWith('/v1/identity/') ||
      requestPath.startsWith('/v1/continuity/');
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
      requestPath.startsWith('/v1/governance/') &&
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

    request.authContext = context;
  });

  app.get('/v1/health', async () => ({
    status: 'ok',
    runtimeRouterUrl,
    engineServiceUrl,
  }));

  app.get('/health', async () => ({ ok: true }));
  app.get('/runtime-health', async () => ({ ok: true }));

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

  app.post('/api/music', frasbergRoute('media', 'music'));
  app.post('/api/video', frasbergRoute('video', 'video'));
  app.post('/api/stt', frasbergRoute('stt', 'stt'));
  app.post('/api/tts', frasbergRoute('tts', 'tts'));
  app.post('/api/audio', frasbergRoute('audio', 'audio'));
  app.get('/api/jobs/:id', frasbergJobRoute());

  app.post('/v1/music/generations', frasbergRoute('media', 'music'));
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
        const response = await routeFrasberg(domain, request.body);
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
      case 'stt':
        return frasbergGateway.stt(payload);
      case 'tts':
        return frasbergGateway.tts(payload);
      case 'audio':
        return frasbergGateway.audio(payload);
    }
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
    | 'rpc_update_continuity_state',
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
