export function buildPersonaModel(identity) {
  return {
    identityModel: identity.self,
    integrationModel: identity.integration,
    timestamp: Date.now()
  };
}
