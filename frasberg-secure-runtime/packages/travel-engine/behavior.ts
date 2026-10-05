export function buildBehavior(motion: any) {
  return {
    structuralBehavior: motion.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "moving" : "stopped",
    harmonyBehavior: motion.travelMotion.harmonyTravel === "stable" ? "smooth" : "rough",
    checksum: Math.random().toString(36).slice(2)
  };
}
