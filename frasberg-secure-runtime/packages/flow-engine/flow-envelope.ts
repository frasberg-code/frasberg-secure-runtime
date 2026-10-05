import { Flow } from "./flow-model";

export function buildFlowEnvelope(flow: Flow) {
  return {
    flowId: flow.flowId,
    circulation: flow.circulation,
    movement: flow.movement,
    flowGraph: flow.flowGraph,
    timestamp: Date.now()
  };
}
