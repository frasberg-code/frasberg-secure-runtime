export function evolveBehavior(behavior) {
  return {
    behaviorId: behavior.behaviorId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
