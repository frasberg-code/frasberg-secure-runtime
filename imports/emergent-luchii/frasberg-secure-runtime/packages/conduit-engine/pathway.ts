export function buildPathway(channel: any) {
  return {
    structuralPathway: channel.transportChannel.flowTransport.pulseCirculation.pulseSignal.timingPulse.alignmentTiming.validationAligned.rulesValidated.consistencyApplied ? "open" : "closed",
    harmonyPathway: channel.conduitChannel.harmonyConduit === "clear" ? "stable" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
