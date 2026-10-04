import { Consciousness } from "./consciousness-model";

export function buildConsciousnessEnvelope(consciousness: Consciousness) {
  return {
    consciousnessId: consciousness.consciousnessId,
    awareness: consciousness.awareness,
    field: consciousness.field,
    consciousnessGraph: consciousness.consciousnessGraph,
    timestamp: Date.now()
  };
}
