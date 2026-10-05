import crypto from "crypto";
import { buildStructure } from "../../../packages/pattern-engine/structure";
import { buildPatternDynamics } from "../../../packages/pattern-engine/dynamics";
import { buildPatternGraph } from "../../../packages/pattern-engine/pattern-graph";

export function injectPattern(req, res, next) {
  const behavior = req.behavior;

  const structure = buildStructure(behavior);
  const dynamics = buildPatternDynamics(structure);
  const graph = buildPatternGraph(dynamics);

  req.pattern = {
    patternId: crypto.randomUUID(),
    structure,
    dynamics,
    patternGraph: graph,
    createdAt: Date.now()
  };

  next();
}
