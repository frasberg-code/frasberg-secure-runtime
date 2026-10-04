import type { GatewayPreHandler } from './identity';

export const governanceGuard: GatewayPreHandler = async (request, reply) => {
  if (
    (request.raw.url ?? '').startsWith('/v1/admin/') &&
    request.principal?.role !== 'admin'
  ) {
    reply.code(403).send({ error: 'Admin access required.' });
  }
};
