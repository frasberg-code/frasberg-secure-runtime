import Fastify, { FastifyInstance } from 'fastify';
import { validateChatRequest } from '@frasberg/shared';

export interface RuntimeRouterOptions {
  upstreamUrl?: string;
  selfBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function guardAgainstSelfRouting(
  upstreamUrl: string,
  selfBaseUrl: string,
  routePath = '/v1/chat/completions',
): void {
  const upstream = new URL(upstreamUrl);
  const self = new URL(selfBaseUrl);

  if (upstream.origin === self.origin && upstream.pathname === routePath) {
    throw new Error(
      'Runtime router upstream would self-route to its own chat endpoint.',
    );
  }
}

export function buildApp(options: RuntimeRouterOptions = {}): FastifyInstance {
  const fetchImpl = options.fetchImpl ?? fetch;
  const upstreamUrl =
    options.upstreamUrl ?? 'http://127.0.0.1:4002/v1/generations/chat';
  const selfBaseUrl = options.selfBaseUrl ?? 'http://127.0.0.1:4001';
  guardAgainstSelfRouting(upstreamUrl, selfBaseUrl);

  const app = Fastify({
    logger: {
      redact: ['req.headers.authorization', 'req.headers.x-api-key'],
    },
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/v1/health', async () => ({ status: 'ok', upstreamUrl }));

  app.post('/v1/chat/completions', async (request, reply) => {
    try {
      const payload = validateChatRequest(request.body);
      const upstreamResponse = await fetchImpl(upstreamUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id':
            typeof request.headers['x-tenant-id'] === 'string'
              ? request.headers['x-tenant-id']
              : 'public',
        },
        body: JSON.stringify(payload),
      });

      const body = await upstreamResponse.json();
      return reply.code(upstreamResponse.status).send(body);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  return app;
}
