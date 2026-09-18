import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import {
  ApiKeyRecord,
  AuthContext,
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
  }
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface GatewayOptions {
  apiKeys?: ApiKeyRecord[];
  runtimeRouterUrl?: string;
  engineServiceUrl?: string;
  fetchImpl?: typeof fetch;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

export function buildApp(options: GatewayOptions = {}): FastifyInstance {
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiKeys =
    options.apiKeys ?? parseApiKeys(process.env.FRASBERG_API_KEYS_JSON);
  const runtimeRouterUrl = options.runtimeRouterUrl ?? 'http://127.0.0.1:4001';
  const engineServiceUrl = options.engineServiceUrl ?? 'http://127.0.0.1:4002';
  const rateLimitMax = options.rateLimitMax ?? 60;
  const rateLimitWindowMs = options.rateLimitWindowMs ?? 60_000;
  const rateLimitState = new Map<string, RateLimitEntry>();

  const app = Fastify({
    logger: {
      redact: ['req.headers.authorization', 'req.headers.x-api-key'],
    },
  });

  app.addHook('preHandler', async (request, reply) => {
    if ((request.raw.url ?? '').startsWith('/v1/health')) {
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

  app.post(
    '/v1/music/generations',
    placeholderRoute('media', 'music generation'),
  );
  app.post(
    '/v1/audio/generations',
    placeholderRoute('audio', 'audio generation'),
  );
  app.post(
    '/v1/video/generations',
    placeholderRoute('video', 'video generation'),
  );
  app.post(
    '/v1/audio/transcriptions',
    placeholderRoute('stt', 'speech transcription'),
  );
  app.post('/v1/audio/speech', placeholderRoute('tts', 'speech synthesis'));

  return app;

  function placeholderRoute(permission: Permission, capability: string) {
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

      const denied = requirePermission(request, reply, permission);
      if (denied) {
        return denied;
      }

      return reply.code(501).send({
        status: 'placeholder',
        capability,
        message:
          'This scaffold intentionally exposes a bounded placeholder route only.',
      });
    };
  }
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
