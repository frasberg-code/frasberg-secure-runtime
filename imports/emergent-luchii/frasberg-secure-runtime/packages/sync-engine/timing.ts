export function buildTiming(coherence: any) {
  return {
    alignmentTiming: coherence.alignment,
    harmonyTiming: coherence.harmony,
    timestamp: Date.now()
  };
}
