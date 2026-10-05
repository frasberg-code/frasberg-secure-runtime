export function buildHarmony(alignment: any) {
  return {
    structuralHarmony: alignment.validationAligned.rulesValidated.consistencyApplied ? "aligned" : "misaligned",
    propagationHarmony: alignment.healthAligned.propagationHealth === "coherent" ? "harmonized" : "discordant",
    checksum: Math.random().toString(36).slice(2)
  };
}
