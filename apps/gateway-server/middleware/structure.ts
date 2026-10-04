import crypto from "crypto";
import { buildArchitecture } from "../../../packages/structure-engine/architecture";
import { buildFabric } from "../../../packages/structure-engine/fabric";
import { buildStructureGraph } from "../../../packages/structure-engine/structure-graph";

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
    createdAt: Date.now()
  };

  next();
}
