import crypto from "crypto";
import { buildStructure } from "../../../packages/pattern-engine/structure";
import { buildFormation } from "../../../packages/pattern-engine/formation";
import { buildPatternGraph } from "../../../packages/pattern-engine/pattern-graph";

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
    createdAt: Date.now()
  };

  next();
}
