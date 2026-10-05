import { evolveFlow } from "../../packages/flow-engine/evolve";

export async function executeFlow(flow: any, input: any) {
  const evolution = evolveFlow(flow);

  return {
    flowId: flow.flowId,
    evolution,
    output: `Flow processed: ${input}`
  };
}
