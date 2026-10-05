export function buildRoleDynamics(func) {
  return {
    structuralRoleDynamics:
      func.characterFunction.personaFormation.identityModel.awarenessSelf.consciousnessPerception.mindAwareness.cognitiveMindspace.reasoningArchitecture.logicCognition.designReasoning.blueprintLogic.architecturePlan.structureBlueprint.patternArchitecture.exchangeStructure.interactionFlow.influenceExchange.fieldPropagation.vectorInfluence.forceDirection.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open"
        ? "active"
        : "dormant",
    harmonyRoleDynamics: func.expressionFunction.harmonyExpression === "stable" ? "coherent" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
