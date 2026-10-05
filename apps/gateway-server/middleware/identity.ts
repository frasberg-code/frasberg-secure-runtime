import crypto from 'crypto';
import { buildSelf } from '../../../packages/identity-engine/self';
import { buildIntegration } from '../../../packages/identity-engine/integration';
import { buildIdentityGraph } from '../../../packages/identity-engine/identity-graph';

export function injectIdentity(req, res, next) {
  const owner = req.headers['x-owner-id'];
  if (!owner) return res.status(400).json({ error: 'Missing owner identity' });

  req.owner = owner;
  next();
}

export function injectEngineIdentity(req: any, res: any, next: any) {
  const awareness = req.awareness;
  if (!awareness) {
    return res
      .status(400)
      .json({ error: 'Missing awareness for identity construction' });
  }

  const self = buildSelf();
  const integration = buildIntegration(self);
  const graph = buildIdentityGraph(integration);

  req.identity = {
    identityId: crypto.randomUUID(),
    self,
    integration,
    identityGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
