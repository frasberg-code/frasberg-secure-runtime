import { describe, expect, it, vi } from 'vitest';
import { structureEngineFlow } from '../middleware/engine-flow';

function createAwareness() {
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
  let perception: any = { structuralPathway: 'open' };

  for (const key of path.reverse()) {
    perception = { [key]: perception };
  }

  return {
    perception,
    field: { harmonyAwarenessField: 'balanced' },
  };
}

describe('structure engine flow', () => {
  it('builds the identity-to-structure chain from awareness', () => {
    const req: any = { body: { awareness: createAwareness(), input: 'test' } };
    const res: any = { status: vi.fn(), json: vi.fn() };
    const next = vi.fn();

    for (const middleware of structureEngineFlow) {
      middleware(req, res, next);
    }

    expect(req.identity.integration.harmonyIntegration).toBe('stable');
    expect(req.identity.identityGraph.nodes[0]).toEqual({
      id: 'self',
      weight: 1,
    });
    expect(req.identity.identityGraph.edges[0].relation).toBe('integrates');
    expect(req.persona.projection.structuralProjection).toBe('expressed');
    expect(req.character.expression.structuralExpression).toBe('manifested');
    expect(req.role.dynamics.structuralRoleDynamics).toBe('active');
    expect(req.func.dynamics.structuralFunctionalDynamics).toBe('operational');
    expect(req.task.dynamics.structuralTaskDynamics).toBe('engaged');
    expect(req.action.dynamics.structuralActionDynamics).toBe('in_motion');
    expect(req.behavior.dynamics.structuralBehaviorDynamics).toBe('emergent');
    expect(req.enginePattern.dynamics.structuralPatternDynamics).toBe(
      'patterned',
    );
    expect(req.engineStructure.dynamics.structuralStructuralDynamics).toBe(
      'structured',
    );
    expect(next).toHaveBeenCalledTimes(structureEngineFlow.length);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a request without awareness', () => {
    const req: any = { body: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    structureEngineFlow[0](req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing awareness for engine construction',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects awareness with a missing structural pathway', () => {
    const req: any = {
      body: {
        awareness: {
          perception: {},
          field: { harmonyAwarenessField: 'balanced' },
        },
      },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    structureEngineFlow[0](req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Awareness is missing required perception or field values',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
