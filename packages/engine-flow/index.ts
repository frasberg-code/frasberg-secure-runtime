import { randomUUID } from 'node:crypto';
import { buildSelf } from '../identity-engine/self';
import { buildIntegration } from '../identity-engine/integration';
import { buildIdentityGraph } from '../identity-engine/identity-graph';
import { evolveIdentity } from '../identity-engine/evolve';
import { buildPersonaModel } from '../persona-engine/model';
import { buildPersonaProjection } from '../persona-engine/projection';
import { buildPersonaGraph } from '../persona-engine/persona-graph';
import { evolvePersona } from '../persona-engine/evolve';
import { buildCharacterFormation } from '../character-engine/formation';
import { buildCharacterExpression } from '../character-engine/expression';
import { buildCharacterGraph } from '../character-engine/character-graph';
import { evolveCharacter } from '../character-engine/evolve';
import { buildRoleFunction } from '../role-engine/function';
import { buildRoleDynamics } from '../role-engine/dynamics';
import { buildRoleGraph } from '../role-engine/role-graph';
import { evolveRole } from '../role-engine/evolve';
import { buildExecution } from '../function-engine/execution';
import { buildFunctionalDynamics } from '../function-engine/dynamics';
import { buildFunctionGraph } from '../function-engine/function-graph';
import { evolveFunction } from '../function-engine/evolve';
import { buildAction } from '../task-engine/action';
import { buildTaskDynamics } from '../task-engine/dynamics';
import { buildTaskGraph } from '../task-engine/task-graph';
import { evolveTask } from '../task-engine/evolve';
import { buildMotion } from '../action-engine/motion';
import { buildActionDynamics } from '../action-engine/dynamics';
import { buildActionGraph } from '../action-engine/action-graph';
import { evolveAction } from '../action-engine/evolve';
import { buildPattern } from '../behavior-engine/pattern';
import { buildBehaviorDynamics } from '../behavior-engine/dynamics';
import { buildBehaviorGraph } from '../behavior-engine/behavior-graph';
import { evolveBehavior } from '../behavior-engine/evolve';
import { buildPatternDynamics } from '../pattern-engine/dynamics';
import { buildPatternGraph } from '../pattern-engine/pattern-graph';
import { buildFormation } from '../structure-engine/formation';
import { buildStructuralDynamics } from '../structure-engine/dynamics';
import { buildStructureGraph } from '../structure-engine/structure-graph';

export type EngineDomain =
  | 'identity'
  | 'persona'
  | 'character'
  | 'role'
  | 'function'
  | 'task'
  | 'action'
  | 'behavior'
  | 'pattern'
  | 'structure';

export interface EngineAwareness {
  perception: Record<string, any>;
  field: Record<string, any>;
}

interface EngineStage {
  id: string;
  value: Record<string, any>;
  evolve: () => Record<string, any>;
}

export function isEngineAwareness(value: unknown): value is EngineAwareness {
  if (
    !isRecord(value) ||
    !isRecord(value.perception) ||
    !isRecord(value.field)
  ) {
    return false;
  }

  let current: unknown = value.perception;
  const path = [
    'consciousnessPerception',
    'mindAwareness',
    'cognitiveMindspace',
    'reasoningArchitecture',
    'logicCognition',
    'designReasoning',
    'blueprintLogic',
    'architecturePlan',
    'structureBlueprint',
    'patternArchitecture',
    'exchangeStructure',
    'interactionFlow',
    'influenceExchange',
    'fieldPropagation',
    'vectorInfluence',
    'forceDirection',
    'dynamicsVector',
    'motionForce',
    'travelKinetics',
    'navigationMotion',
    'routeDecision',
    'pathNavigation',
    'directionMap',
    'pathwayDirection',
  ];

  for (const key of path) {
    if (!isRecord(current)) return false;
    current = current[key];
  }

  return (
    isRecord(current) &&
    typeof current.structuralPathway === 'string' &&
    typeof value.field.harmonyAwarenessField === 'string'
  );
}

export function executeEngine(
  domain: EngineDomain,
  awareness: EngineAwareness,
  input: string,
) {
  const stages = buildEngineStages(awareness);
  const stage = stages[domain];

  return {
    [idFieldFor(domain)]: stage.id,
    evolution: stage.evolve(),
    output: `${displayNameFor(domain)} processed: ${input}`,
  };
}

function buildEngineStages(
  awareness: EngineAwareness,
): Record<EngineDomain, EngineStage> {
  const self = buildSelf(awareness);
  const integration = buildIntegration(self);
  const identity = {
    identityId: randomUUID(),
    self,
    integration,
    identityGraph: buildIdentityGraph(integration),
    createdAt: Date.now(),
  };

  const model = buildPersonaModel(identity);
  const projection = buildPersonaProjection(model);
  const persona = {
    personaId: randomUUID(),
    model,
    projection,
    personaGraph: buildPersonaGraph(projection),
    createdAt: Date.now(),
  };

  const formation = buildCharacterFormation(persona);
  const expression = buildCharacterExpression(formation);
  const character = {
    characterId: randomUUID(),
    formation,
    expression,
    characterGraph: buildCharacterGraph(expression),
    createdAt: Date.now(),
  };

  const roleFunction = buildRoleFunction(character);
  const roleDynamics = buildRoleDynamics(roleFunction);
  const role = {
    roleId: randomUUID(),
    function: roleFunction,
    dynamics: roleDynamics,
    roleGraph: buildRoleGraph(roleDynamics),
    createdAt: Date.now(),
  };

  const execution = buildExecution(role);
  const functionalDynamics = buildFunctionalDynamics(execution);
  const func = {
    functionId: randomUUID(),
    execution,
    dynamics: functionalDynamics,
    functionGraph: buildFunctionGraph(functionalDynamics),
    createdAt: Date.now(),
  };

  const taskAction = buildAction(func);
  const taskDynamics = buildTaskDynamics(taskAction);
  const task = {
    taskId: randomUUID(),
    action: taskAction,
    dynamics: taskDynamics,
    taskGraph: buildTaskGraph(taskDynamics),
    createdAt: Date.now(),
  };

  const motion = buildMotion(task);
  const actionDynamics = buildActionDynamics(motion);
  const action = {
    actionId: randomUUID(),
    motion,
    dynamics: actionDynamics,
    actionGraph: buildActionGraph(actionDynamics),
    createdAt: Date.now(),
  };

  const behaviorPattern = buildPattern(action);
  const behaviorDynamics = buildBehaviorDynamics(behaviorPattern);
  const behavior = {
    behaviorId: randomUUID(),
    pattern: behaviorPattern,
    dynamics: behaviorDynamics,
    behaviorGraph: buildBehaviorGraph(behaviorDynamics),
    createdAt: Date.now(),
  };

  const patternStructure = {
    behaviorStructure: behavior.pattern,
    dynamicsStructure: behavior.dynamics,
    timestamp: Date.now(),
  };
  const patternDynamics = buildPatternDynamics(patternStructure);
  const pattern = {
    patternId: randomUUID(),
    structure: patternStructure,
    dynamics: patternDynamics,
    patternGraph: buildPatternGraph(patternDynamics),
    createdAt: Date.now(),
  };

  const structureFormation = buildFormation(pattern);
  const structuralDynamics = buildStructuralDynamics(structureFormation);
  const structure = {
    structureId: randomUUID(),
    formation: structureFormation,
    dynamics: structuralDynamics,
    structureGraph: buildStructureGraph(structuralDynamics),
    createdAt: Date.now(),
  };

  return {
    identity: {
      id: identity.identityId,
      value: identity,
      evolve: () => evolveIdentity(identity),
    },
    persona: {
      id: persona.personaId,
      value: persona,
      evolve: () => evolvePersona(persona),
    },
    character: {
      id: character.characterId,
      value: character,
      evolve: () => evolveCharacter(character),
    },
    role: { id: role.roleId, value: role, evolve: () => evolveRole(role) },
    function: {
      id: func.functionId,
      value: func,
      evolve: () => evolveFunction(func),
    },
    task: { id: task.taskId, value: task, evolve: () => evolveTask(task) },
    action: {
      id: action.actionId,
      value: action,
      evolve: () => evolveAction(action),
    },
    behavior: {
      id: behavior.behaviorId,
      value: behavior,
      evolve: () => evolveBehavior(behavior),
    },
    pattern: {
      id: pattern.patternId,
      value: pattern,
      evolve: () => ({
        patternId: pattern.patternId,
        evolutionScore: Math.random(),
        evolvedAt: Date.now(),
      }),
    },
    structure: {
      id: structure.structureId,
      value: structure,
      evolve: () => ({
        structureId: structure.structureId,
        evolutionScore: Math.random(),
        evolvedAt: Date.now(),
      }),
    },
  };
}

function idFieldFor(domain: EngineDomain): string {
  return domain === 'function' ? 'functionId' : `${domain}Id`;
}

function displayNameFor(domain: EngineDomain): string {
  return domain === 'function'
    ? 'Function'
    : domain[0].toUpperCase() + domain.slice(1);
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
