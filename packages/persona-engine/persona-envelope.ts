import type { Persona } from "./persona-model";

export function buildPersonaEnvelope(persona: Persona) {
  return {
    personaId: persona.personaId,
    model: persona.model,
    projection: persona.projection,
    personaGraph: persona.personaGraph,
    timestamp: Date.now()
  };
}
