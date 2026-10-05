import crypto from 'crypto';
import { buildArchitecture } from '../../../packages/structure-engine/architecture';
import { buildFabric } from '../../../packages/structure-engine/fabric';
import { buildStructureGraph } from '../../../packages/structure-engine/structure-graph';
import { buildFormation } from '../../../packages/structure-engine/formation';
import { buildStructuralDynamics } from '../../../packages/structure-engine/dynamics';

export function injectStructure(req: any, res: any, next: any) {
  const pattern = req.pattern;

  const architecture = buildArchitecture(pattern);
  const fabric = buildFabric(architecture);
  const graph = buildStructureGraph(fabric);

  req.structure = {
    structureId: crypto.randomUUID(),
    architecture,
    fabric,
    structureGraph: graph,
    createdAt: Date.now(),
  };

  next();
}

export function injectStructureFormation(req: any, res: any, next: any) {
  const pattern = req.enginePattern;
  if (!pattern) {
    return res
      .status(400)
      .json({ error: 'Missing engine pattern for structure construction' });
  }

  const formation = buildFormation(pattern);
  const dynamics = buildStructuralDynamics(formation);
  const graph = buildStructureGraph(dynamics);

  req.engineStructure = {
    structureId: crypto.randomUUID(),
    formation,
    dynamics,
    structureGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
