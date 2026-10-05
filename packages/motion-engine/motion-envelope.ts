import { Motion } from "./motion-model";

export function buildMotionEnvelope(motion: Motion) {
  return {
    motionId: motion.motionId,
    kinetics: motion.kinetics,
    dynamics: motion.dynamics,
    motionGraph: motion.motionGraph,
    timestamp: Date.now()
  };
}
