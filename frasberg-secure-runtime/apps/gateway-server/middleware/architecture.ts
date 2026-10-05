import crypto from "crypto";
import { buildBlueprint } from "../../../packages/architecture-engine/blueprint";
import { buildDesign } from "../../../packages/architecture-engine/design";
import { buildArchitectureGraph } from "../../../packages/architecture-engine/architecture-graph";

export function injectArchitecture(req: any, res: any, next: any) {
  const structure = req.structure;

  const blueprint = buildBlueprint(structure);
  const design = buildDesign(blueprint);
  const graph = buildArchitectureGraph(design);

  req.architecture = {
    architectureId: crypto.randomUUID(),
    blueprint,
    design,
    architectureGraph: graph,
    createdAt: Date.now()
  };

  next();
}
