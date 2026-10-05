import { evolveForce } from "../../packages/force-engine/evolve";

export async function executeForce(force: any, input: any) {
  const evolution = evolveForce(force);

  return {
    forceId: force.forceId,
    evolution,
    output: `Force processed: ${input}`
  };
}
