import type { FastifyInstance } from 'fastify';
import {
  injectIdentity,
  type GatewayPreHandler,
  type IdentityAuthenticator,
} from './identity';
import { injectContinuity } from './continuity';
import { injectDiagnostics } from './diagnostics';
import { injectPolicy } from './policy';
import { governanceGuard } from './governance-guard';

export type { GatewayPrincipal } from './identity';

type GatewayMiddlewareFactory = (
  authenticate: IdentityAuthenticator,
) => GatewayPreHandler;

export const unifiedMiddleware: GatewayMiddlewareFactory[] = [
  injectIdentity,
  () => injectContinuity,
  () => injectDiagnostics,
  () => injectPolicy,
  () => governanceGuard,
];

export function registerUnifiedMiddleware(
  app: FastifyInstance,
  authenticate: IdentityAuthenticator,
): void {
  for (const createMiddleware of unifiedMiddleware) {
    app.addHook('preHandler', createMiddleware(authenticate));
  }
}
