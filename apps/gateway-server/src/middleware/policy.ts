import type { GatewayPreHandler } from './identity';

export const injectPolicy: GatewayPreHandler = async (request, reply) => {
  if (!(request.raw.url ?? '').startsWith('/v1/health') && !request.principal) {
    reply.code(401).send({ error: 'Unauthorized.' });
  }
};
