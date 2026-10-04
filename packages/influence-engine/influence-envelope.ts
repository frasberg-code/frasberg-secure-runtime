import { Influence } from "./influence-model";

export function buildInfluenceEnvelope(influence: Influence) {
  return {
    influenceId: influence.influenceId,
    propagation: influence.propagation,
    interaction: influence.interaction,
    influenceGraph: influence.influenceGraph,
    timestamp: Date.now()
  };
}
