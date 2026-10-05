export function buildRhythm(timing: any) {
  return {
    structuralRhythm: timing.alignmentTiming.validationAligned.rulesValidated.consistencyApplied ? "synchronized" : "desynced",
    harmonyRhythm: timing.harmonyTiming.propagationHarmony === "coherent" ? "in-rhythm" : "off-beat",
    checksum: Math.random().toString(36).slice(2)
  };
}
