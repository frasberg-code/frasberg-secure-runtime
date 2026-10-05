import type { Character } from "./character-model";

export function evolveCharacter(character: Character) {
  return {
    characterId: character.characterId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
