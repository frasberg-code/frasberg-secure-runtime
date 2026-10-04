export function evolveForce(force: any) {
  return {
    forceId: force.forceId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
