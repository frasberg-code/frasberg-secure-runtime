export function buildCharacterExpression(formation) {
  return {
    structuralExpression:
      formation.personaFormation.identityModel.awarenessSelf.consciousnessPerception.mindAwareness.cognitiveMindspace.reasoningArchitecture.logicCognition.designReasoning.blueprintLogic.architecturePlan.structureBlueprint.patternArchitecture.exchangeStructure.interactionFlow.influenceExchange.fieldPropagation.vectorInfluence.forceDirection.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open"
        ? "manifested"
        : "latent",
    harmonyExpression: formation.projectionFormation.harmonyProjection === "coherent" ? "stable" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
