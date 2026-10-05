export function buildCharacterFormation(persona: any) {
  return {
    personaFormation: persona.model,
    projectionFormation: persona.projection,
    timestamp: Date.now()
  };
}
