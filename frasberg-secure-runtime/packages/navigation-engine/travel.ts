export function buildTravel(decision: any) {
  return {
    structuralTravel: decision.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "go" : "halt",
    harmonyTravel: decision.directiveDecision.harmonyDirective === "steady" ? "stable" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
