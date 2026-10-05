export function buildDynamics(kinetics: any) {
  return {
    structuralDynamics: kinetics.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "active" : "inactive",
    harmonyDynamics: kinetics.behaviorKinetics.harmonyBehavior === "smooth" ? "fluid" : "chaotic",
    checksum: Math.random().toString(36).slice(2)
  };
}
