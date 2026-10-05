export function buildCharacterEnvelope(character) {
  return {
    characterId: character.characterId,
    formation: character.formation,
    expression: character.expression,
    characterGraph: character.characterGraph,
    timestamp: Date.now()
  };
}
