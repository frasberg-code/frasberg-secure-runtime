import { ZeroPoint } from "./zeropoint-model";

export function buildZeroEnvelope(zero: ZeroPoint) {
  return {
    zeroId: zero.zeroId,
    baseline: zero.baseline,
    singularity: zero.singularity,
    zeroGraph: zero.zeroGraph,
    timestamp: Date.now()
  };
}
