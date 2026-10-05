export function buildTaskDynamics(action: any) {
  return {
    structuralTaskDynamics:
      action.functionAction.roleExecution.characterFunction.personaFormation.identityModel.awarenessSelf.consciousnessPerception.mindAwareness.cognitiveMindspace.reasoningArchitecture.logicCognition.designReasoning.blueprintLogic.architecturePlan.structureBlueprint.patternArchitecture.exchangeStructure.interactionFlow.influenceExchange.fieldPropagation.vectorInfluence.forceDirection.dynamicsVector.motionForce.travelKinetics.navigationMotion.routeDecision.pathNavigation.directionMap.pathwayDirection.structuralPathway ===
      "open"
        ? "engaged"
        : "idle",
    harmonyTaskDynamics:
      action.dynamicsAction.harmonyFunctionalDynamics === "stable" ? "coherent" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
