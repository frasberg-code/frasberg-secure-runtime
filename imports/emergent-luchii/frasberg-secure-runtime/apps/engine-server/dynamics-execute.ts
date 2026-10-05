import { evolveDynamics } from "../../packages/dynamics-engine/evolve";

export async function executeDynamics(dynamics: any, input: any) {
  const evolution = evolveDynamics(dynamics);

  return {
    dynamicsId: dynamics.dynamicsId,
    evolution,
    output: `Dynamics processed: ${input}`
  };
}
