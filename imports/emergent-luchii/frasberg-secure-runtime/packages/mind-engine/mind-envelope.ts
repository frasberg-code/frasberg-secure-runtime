import { Mind } from "./mind-model";

export function buildMindEnvelope(mind: Mind) {
  return {
    mindId: mind.mindId,
    mindspace: mind.mindspace,
    field: mind.field,
    mindGraph: mind.mindGraph,
    timestamp: Date.now()
  };
}
