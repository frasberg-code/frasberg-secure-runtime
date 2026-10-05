import { evolveCharacter } from '../../packages/character-engine/evolve';

export async function executeCharacter(character: any, input: any) {
  const evolution = evolveCharacter(character);

  return {
    characterId: character.characterId,
    evolution,
    output: `Character processed: ${input}`,
  };
}
