import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GatewayPreHandler } from './identity';

declare module 'fastify' {
  interface FastifyRequest {
    continuityId?: string;
  }
}

export const injectContinuity: GatewayPreHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const continuityId = request.headers['x-continuity-id'];
  if (continuityId === undefined) {
    return;
  }
  if (
    typeof continuityId !== 'string' ||
    !continuityId.trim() ||
    continuityId.length > 256
  ) {
    reply.code(400).send({ error: 'Invalid continuity identifier.' });
    return;
  }
  request.continuityId = continuityId.trim();
};
