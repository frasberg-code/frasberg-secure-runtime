export function evolveMotion(motion: any) {
  return {
    motionId: motion.motionId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
