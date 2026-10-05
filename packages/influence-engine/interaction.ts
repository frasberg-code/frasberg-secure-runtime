export function buildInteraction(propagation: any) {
  return {
    structuralInteraction: propagation.fieldPropagation.vectorInfluence.forceDirection.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "interactive" : "isolated",
    harmonyInteraction: propagation.topologyPropagation.harmonyTopology === "coherent" ? "stable" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
