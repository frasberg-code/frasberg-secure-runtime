import { evolveBehavior } from "../../packages/behavior-engine/evolve";

export async function executeBehavior(behavior, input) {
  const evolution = evolveBehavior(behavior);

  return {
    behaviorId: behavior.behaviorId,
    evolution,
    output: `Behavior processed: ${input}`
  };
}
