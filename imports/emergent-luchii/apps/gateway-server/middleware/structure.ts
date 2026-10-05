import crypto from "crypto";
import { buildFormation } from "../../../packages/structure-engine/formation";
import { buildStructuralDynamics } from "../../../packages/structure-engine/dynamics";
import { buildStructureGraph } from "../../../packages/structure-engine/structure-graph";

export function injectStructure(req, res, next) {
  const pattern = req.pattern;

  const formation = buildFormation(pattern);
  const dynamics = buildStructuralDynamics(formation);
  const graph = buildStructureGraph(dynamics);

  req.structure = {
    structureId: crypto.randomUUID(),
    formation,
    dynamics,
    structureGraph: graph,
    createdAt: Date.now()
  };

  next();
}
