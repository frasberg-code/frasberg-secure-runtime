import crypto from 'crypto';
import { buildStructure } from '../../../packages/pattern-engine/structure';
import { buildFormation } from '../../../packages/pattern-engine/formation';
import { buildPatternGraph } from '../../../packages/pattern-engine/pattern-graph';
import { buildPatternDynamics } from '../../../packages/pattern-engine/dynamics';

export function injectPattern(req: any, res: any, next: any) {
  const exchange = req.exchange;

  const structure = buildStructure(exchange);
  const formation = buildFormation(structure);
  const graph = buildPatternGraph(formation);

  req.pattern = {
    patternId: crypto.randomUUID(),
    structure,
    formation,
    patternGraph: graph,
    createdAt: Date.now(),
  };

  next();
}

export function injectEnginePattern(req: any, res: any, next: any) {
  const behavior = req.behavior;
  if (!behavior) {
    return res
      .status(400)
      .json({ error: 'Missing behavior for pattern construction' });
  }

  const structure = {
    behaviorStructure: behavior.pattern,
    dynamicsStructure: behavior.dynamics,
    timestamp: Date.now(),
  };
  const dynamics = buildPatternDynamics(structure);
  const graph = buildPatternGraph(dynamics);

  req.enginePattern = {
    patternId: crypto.randomUUID(),
    structure,
    dynamics,
    patternGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
