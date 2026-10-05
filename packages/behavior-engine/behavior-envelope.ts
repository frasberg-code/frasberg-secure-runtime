export function buildBehaviorEnvelope(behavior) {
  return {
    behaviorId: behavior.behaviorId,
    pattern: behavior.pattern,
    dynamics: behavior.dynamics,
    behaviorGraph: behavior.behaviorGraph,
    timestamp: Date.now()
  };
}
