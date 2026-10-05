import { Reasoning } from "./reasoning-model";

export function buildReasoningEnvelope(reasoning: Reasoning) {
  return {
    reasoningId: reasoning.reasoningId,
    cognition: reasoning.cognition,
    interpretation: reasoning.interpretation,
    reasoningGraph: reasoning.reasoningGraph,
    timestamp: Date.now()
  };
}
