export function buildForce(motion: any) {
  return {
    motionForce: motion.kinetics,
    dynamicForce: motion.dynamics,
    timestamp: Date.now()
  };
}
