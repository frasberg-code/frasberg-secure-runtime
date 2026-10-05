export function buildPulse(sync: any) {
  return {
    timingPulse: sync.timing,
    rhythmPulse: sync.rhythm,
    timestamp: Date.now()
  };
}
