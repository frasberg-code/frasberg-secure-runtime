export function evolveLaw(law: any) {
  return {
    lawId: law.lawId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
