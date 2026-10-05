export function buildField(direction: any) {
  return {
    structuralField: direction.forceDirection.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "directed" : "neutral",
    harmonyField: direction.pressureDirection.harmonyPressure === "balanced" ? "stable" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
