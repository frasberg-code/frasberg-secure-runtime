import { evolvePersona } from '../../packages/persona-engine/evolve';

export async function executePersona(persona: any, input: any) {
  const evolution = evolvePersona(persona);

  return {
    personaId: persona.personaId,
    evolution,
    output: `Persona processed: ${input}`,
  };
}
