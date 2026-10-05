export function buildBeat(pulse: any) {
  return {
    structuralBeat: pulse.timingPulse.alignmentTiming.validationAligned.rulesValidated.consistencyApplied ? "steady" : "irregular",
    harmonyBeat: pulse.rhythmPulse.harmonyRhythm === "in-rhythm" ? "smooth" : "rough",
    checksum: Math.random().toString(36).slice(2)
  };
}
