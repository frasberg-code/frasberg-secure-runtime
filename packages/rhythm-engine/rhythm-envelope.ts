import { Rhythm } from "./rhythm-model";

export function buildRhythmEnvelope(rhythm: Rhythm) {
  return {
    rhythmId: rhythm.rhythmId,
    pulse: rhythm.pulse,
    beat: rhythm.beat,
    rhythmGraph: rhythm.rhythmGraph,
    timestamp: Date.now()
  };
}
