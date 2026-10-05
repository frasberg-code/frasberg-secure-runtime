import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FrasbergService } from './service-map';

export type MetricsConfig = {
  services: FrasbergService[];
};

const counters = {
  requests: new Map<string, number>(),
  errors: new Map<string, number>(),
};

export function initMetrics(config: MetricsConfig) {
  for (const service of config.services) {
    counters.requests.set(service, 0);
    counters.errors.set(service, 0);
  }

  function track(service: FrasbergService, ok: boolean): void {
    counters.requests.set(service, (counters.requests.get(service) ?? 0) + 1);
    if (!ok) {
      counters.errors.set(service, (counters.errors.get(service) ?? 0) + 1);
    }
  }

  function middleware(
    request: FastifyRequest,
    _reply: FastifyReply,
    next: () => void,
  ) {
    (request as typeof request & { metrics?: { track: typeof track } }).metrics = {
      track,
    };
    next();
  }

  function handler(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      requests: Object.fromEntries(counters.requests),
      errors: Object.fromEntries(counters.errors),
    });
  }

  return { middleware, handler, track };
}
