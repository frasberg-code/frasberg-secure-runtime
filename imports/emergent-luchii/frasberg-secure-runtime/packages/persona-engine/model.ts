export function buildPersonaModel(identity: any) {
  return {
    identityModel: identity.self,
    integrationModel: identity.integration,
    timestamp: Date.now()
  };
}
