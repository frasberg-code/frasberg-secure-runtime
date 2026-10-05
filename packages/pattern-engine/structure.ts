export function buildStructure(behavior) {
  return {
    behaviorStructure: behavior.pattern,
    dynamicsStructure: behavior.dynamics,
    timestamp: Date.now()
  };
}
