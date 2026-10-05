export function buildPersonaProjection(model: any) {
  return {
    structuralProjection:
      model.identityModel.awarenessSelf.consciousnessPerception.mindAwareness.cognitiveMindspace.reasoningArchitecture.logicCognition.designReasoning.blueprintLogic.architecturePlan.structureBlueprint.patternArchitecture.exchangeStructure.interactionFlow.influenceExchange.fieldPropagation.vectorInfluence.forceDirection.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway ===
      "open"
        ? "expressed"
        : "suppressed",
    harmonyProjection:
      model.integrationModel.harmonyIntegration === "stable" ? "coherent" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
