import type { FastifyReply, FastifyRequest } from 'fastify';

export interface GatewayPrincipal {
  sub: string;
  role: 'admin' | 'user';
}

declare module 'fastify' {
  interface FastifyRequest {
    principal?: GatewayPrincipal;
  }
}

export type IdentityAuthenticator = (
  request: FastifyRequest,
) => Promise<GatewayPrincipal | undefined>;

export type GatewayPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<void>;

export function injectIdentity(
  authenticate: IdentityAuthenticator,
): GatewayPreHandler {
  return async (request, reply) => {
    if ((request.raw.url ?? '').startsWith('/v1/health')) {
      return;
    }

    const principal = await authenticate(request);
    if (!principal) {
      reply.code(401).send({ error: 'Unauthorized.' });
      return;
    }
    request.principal = principal;
  };
}
