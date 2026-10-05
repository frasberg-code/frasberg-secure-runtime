export function buildHealth(validation: any) {
  return {
    structuralHealth: validation.rulesValidated.consistencyApplied ? "stable" : "unstable",
    propagationHealth: validation.propagationValidated.invariantPropagation ? "coherent" : "incoherent",
    checksum: Math.random().toString(36).slice(2)
  };
}
