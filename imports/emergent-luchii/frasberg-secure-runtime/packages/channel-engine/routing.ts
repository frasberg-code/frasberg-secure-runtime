export function buildRouting(direction: any) {
  return {
    structuralRouting: direction.pathwayDirection.structuralPathway === "open" ? "forward" : "halted",
    harmonyRouting: direction.channelDirection.harmonyPathway === "stable" ? "smooth" : "erratic",
    checksum: Math.random().toString(36).slice(2)
  };
}
