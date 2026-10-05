import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Fastify from 'fastify';
import { FrasbergService } from './service-map';
import { callService } from './router';

export type AgentContext = {
  id?: string;
  userId?: string;
  traceId?: string;
};

export function initAgentRuntime(): { router: (instance: FastifyInstance) => void } {
  const router = (instance: FastifyInstance) => {
    instance.post('/:service/:path*', async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { service?: string; path?: string };
      const serviceName = params.service as FrasbergService;
      const routePath = params.path ? `/${params.path}` : '/';
      const headers = request.headers as Record<string, string | string[] | undefined>;
      const ctx: AgentContext = {
        id: typeof headers['x-agent-id'] === 'string' ? headers['x-agent-id'] : undefined,
        userId: typeof headers['x-user-id'] === 'string' ? headers['x-user-id'] : undefined,
        traceId: typeof headers['x-trace-id'] === 'string' ? headers['x-trace-id'] : undefined,
      };

      try {
        const upstream = await callService(serviceName, routePath, {
          method: request.method,
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ ctx, payload: request.body }),
        });
        const json = await upstream.json();
        return reply.code(200).send(json);
      } catch (error) {
        return reply.code(500).send({ ok: false, error: (error as Error).message });
      }
    });
  };

  return { router };
}
