import { Dynamics } from "./dynamics-model";

export function buildDynamicsEnvelope(dynamics: Dynamics) {
  return {
    dynamicsId: dynamics.dynamicsId,
    force: dynamics.force,
    acceleration: dynamics.acceleration,
    dynamicsGraph: dynamics.dynamicsGraph,
    timestamp: Date.now()
  };
}
