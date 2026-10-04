export function buildAcceleration(force: any) {
  return {
    structuralAcceleration: force.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "accelerating" : "static",
    harmonyAcceleration: force.dynamicForce.harmonyDynamics === "fluid" ? "stable" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
