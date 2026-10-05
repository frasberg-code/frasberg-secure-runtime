import { Force } from "./force-model";

export function buildForceEnvelope(force: Force) {
  return {
    forceId: force.forceId,
    vector: force.vector,
    pressure: force.pressure,
    forceGraph: force.forceGraph,
    timestamp: Date.now()
  };
}
