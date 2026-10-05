export function buildFormation(structure: any) {
  return {
    structuralFormation: structure.exchangeStructure.interactionFlow.influenceExchange.fieldPropagation.vectorInfluence.forceDirection.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "formed" : "unformed",
    harmonyFormation: structure.mechanicStructure.harmonyMechanic === "stable" ? "coherent" : "chaotic",
    checksum: Math.random().toString(36).slice(2)
  };
}
