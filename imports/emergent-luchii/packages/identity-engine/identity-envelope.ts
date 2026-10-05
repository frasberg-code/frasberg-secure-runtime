export function buildIdentityEnvelope(identity) {
  return {
    identityId: identity.identityId,
    self: identity.self,
    integration: identity.integration,
    identityGraph: identity.identityGraph,
    timestamp: Date.now()
  };
}
