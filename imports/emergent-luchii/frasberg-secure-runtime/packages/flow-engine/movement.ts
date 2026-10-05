export function buildMovement(circulation: any) {
  return {
    structuralMovement: circulation.pulseCirculation.pulseSignal.timingPulse.alignmentTiming.validationAligned.rulesValidated.consistencyApplied ? "flowing" : "stalled",
    harmonyMovement: circulation.distributionCirculation.harmonyDistribution === "flowing" ? "smooth" : "turbulent",
    checksum: Math.random().toString(36).slice(2)
  };
}
