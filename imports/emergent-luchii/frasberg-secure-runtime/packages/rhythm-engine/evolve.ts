export function evolveRhythm(rhythm: any) {
  return {
    rhythmId: rhythm.rhythmId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
