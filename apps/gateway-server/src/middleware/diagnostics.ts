import type { GatewayPreHandler } from './identity';

export const injectDiagnostics: GatewayPreHandler = async (request, reply) => {
  reply.header('x-request-id', request.id);
};
