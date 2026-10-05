export function evolveCirculation(circulation: any) {
  return {
    circulationId: circulation.circulationId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
