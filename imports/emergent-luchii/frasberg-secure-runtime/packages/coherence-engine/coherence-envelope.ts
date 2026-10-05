import { Coherence } from "./coherence-model";

export function buildCoherenceEnvelope(coherence: Coherence) {
  return {
    coherenceId: coherence.coherenceId,
    alignment: coherence.alignment,
    harmony: coherence.harmony,
    coherenceGraph: coherence.coherenceGraph,
    timestamp: Date.now()
  };
}
