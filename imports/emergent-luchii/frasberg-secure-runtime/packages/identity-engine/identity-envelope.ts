import type { Identity } from "./identity-model";

export function buildIdentityEnvelope(identity: Identity) {
  return {
    identityId: identity.identityId,
    self: identity.self,
    integration: identity.integration,
    identityGraph: identity.identityGraph,
    timestamp: Date.now()
  };
}
