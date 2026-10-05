export function evolveEnforcement(enforcement: any) {
  return {
    enforcementId: enforcement.enforcementId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
