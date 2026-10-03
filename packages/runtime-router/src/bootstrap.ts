import Fastify, { type FastifyInstance } from 'fastify';
import { SERVICES } from './service-map';
import { initMetrics } from './metrics';
import { initAgentRuntime } from './agents';
import { executeLinqPipeline } from './pipeline/linq-core-compute';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const metrics = initMetrics({ services: [...SERVICES] });

  app.addHook('onRequest', metrics.middleware);

  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/metrics', async (request, reply) => metrics.handler(request, reply));

  const agents = initAgentRuntime();
  await app.register(agents.router, { prefix: '/agents' });

  app.post('/linq/execute', async (request, reply) => {
    try {
      const payload = (request.body ?? {}) as Partial<{
        query: string;
        userId: string;
        context: Record<string, unknown>;
      }>;

      const result = await executeLinqPipeline({
        query: payload.query ?? 'health-check',
        userId: payload.userId ?? 'system',
        context: payload.context ?? {},
      });
      return reply.code(200).send({ ok: true, result });
    } catch (error) {
      return reply.code(500).send({ ok: false, error: (error as Error).message });
    }
  });

  return app;
}
