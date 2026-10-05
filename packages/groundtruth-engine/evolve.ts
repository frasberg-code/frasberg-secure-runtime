export function evolveTruth(truth: any) {
  return {
    truthId: truth.truthId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
