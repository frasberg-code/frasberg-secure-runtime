import type { Behavior } from "./behavior-model";

export function buildBehaviorEnvelope(behavior: Behavior) {
  return {
    behaviorId: behavior.behaviorId,
    pattern: behavior.pattern,
    dynamics: behavior.dynamics,
    behaviorGraph: behavior.behaviorGraph,
    timestamp: Date.now()
  };
}
