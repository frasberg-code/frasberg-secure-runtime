export function buildCharacterFormation(persona) {
  return {
    personaFormation: persona.model,
    projectionFormation: persona.projection,
    timestamp: Date.now()
  };
}
