import { Cognition } from "./cognition-model";

export function buildCognitionEnvelope(cognition: Cognition) {
  return {
    cognitionId: cognition.cognitionId,
    architecture: cognition.architecture,
    dynamics: cognition.dynamics,
    cognitionGraph: cognition.cognitionGraph,
    timestamp: Date.now()
  };
}
