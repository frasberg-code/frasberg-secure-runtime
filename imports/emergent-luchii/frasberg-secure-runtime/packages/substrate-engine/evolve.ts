export function evolveSubstrate(substrate: any) {
  return {
    substrateId: substrate.substrateId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
