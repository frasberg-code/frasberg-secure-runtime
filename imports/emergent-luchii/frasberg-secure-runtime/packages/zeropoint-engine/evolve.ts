export function evolveZero(zero: any) {
  return {
    zeroId: zero.zeroId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
