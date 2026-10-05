export function buildPersonaEnvelope(persona) {
  return {
    personaId: persona.personaId,
    model: persona.model,
    projection: persona.projection,
    personaGraph: persona.personaGraph,
    timestamp: Date.now()
  };
}
