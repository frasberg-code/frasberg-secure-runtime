import type { Character } from "./character-model";

export function buildCharacterEnvelope(character: Character) {
  return {
    characterId: character.characterId,
    formation: character.formation,
    expression: character.expression,
    characterGraph: character.characterGraph,
    timestamp: Date.now()
  };
}
