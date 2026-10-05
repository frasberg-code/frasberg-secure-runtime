import { injectEngineIdentity } from './identity';
import { injectPersona } from './persona';
import { injectCharacter } from './character';
import { injectRole } from './role';
import { injectFunction } from './function';
import { injectTask } from './task';
import { injectAction } from './action';
import { injectBehavior } from './behavior';
import { injectEnginePattern } from './pattern';
import { injectStructureFormation } from './structure';

export function requireEngineAwareness(req: any, res: any, next: any) {
  if (!req.awareness && req.body?.awareness) {
    req.awareness = req.body.awareness;
  }

  if (!req.awareness) {
    return res
      .status(400)
      .json({ error: 'Missing awareness for engine construction' });
  }

  const structuralPathway =
    req.awareness.perception?.consciousnessPerception?.mindAwareness
      ?.cognitiveMindspace?.reasoningArchitecture?.logicCognition
      ?.designReasoning?.blueprintLogic?.architecturePlan?.structureBlueprint
      ?.patternArchitecture?.exchangeStructure?.interactionFlow
      ?.influenceExchange?.fieldPropagation?.vectorInfluence?.forceDirection
      ?.dynamicsVector?.motionForce?.travelKinetics?.navigationMotion
      ?.routeDecision?.pathNavigation?.directionMap?.pathwayDirection
      ?.structuralPathway;
  if (
    typeof structuralPathway !== 'string' ||
    typeof req.awareness.field?.harmonyAwarenessField !== 'string'
  ) {
    return res.status(400).json({
      error: 'Awareness is missing required perception or field values',
    });
  }

  next();
}

export const identityEngineFlow = [
  requireEngineAwareness,
  injectEngineIdentity,
];
export const personaEngineFlow = [...identityEngineFlow, injectPersona];
export const characterEngineFlow = [...personaEngineFlow, injectCharacter];
export const roleEngineFlow = [...characterEngineFlow, injectRole];
export const functionEngineFlow = [...roleEngineFlow, injectFunction];
export const taskEngineFlow = [...functionEngineFlow, injectTask];
export const actionEngineFlow = [...taskEngineFlow, injectAction];
export const behaviorEngineFlow = [...actionEngineFlow, injectBehavior];
export const patternEngineFlow = [...behaviorEngineFlow, injectEnginePattern];
export const structureEngineFlow = [
  ...patternEngineFlow,
  injectStructureFormation,
];
