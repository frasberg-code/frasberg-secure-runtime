import { GroundTruth } from "./groundtruth-model";

export function buildTruthEnvelope(truth: GroundTruth) {
  return {
    truthId: truth.truthId,
    laws: truth.laws,
    invariants: truth.invariants,
    truthGraph: truth.truthGraph,
    timestamp: Date.now()
  };
}
