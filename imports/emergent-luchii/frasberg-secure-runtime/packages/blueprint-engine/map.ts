export function buildBlueprintMap(plan: any) {
  return {
    structuralMap: plan.architecturePlan.structureBlueprint.patternArchitecture.exchangeStructure.interactionFlow.influenceExchange.fieldPropagation.vectorInfluence.forceDirection.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "mapped" : "unmapped",
    harmonyMap: plan.designPlan.harmonyDesign === "coherent" ? "stable" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
