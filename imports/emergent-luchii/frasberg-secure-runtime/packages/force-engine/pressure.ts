export function buildPressure(vector: any) {
  return {
    structuralPressure: vector.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "applied" : "neutral",
    harmonyPressure: vector.accelerationVector.harmonyAcceleration === "stable" ? "balanced" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
