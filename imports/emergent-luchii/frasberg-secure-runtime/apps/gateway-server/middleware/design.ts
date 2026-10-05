import crypto from "crypto";
import { buildLogic } from "../../../packages/design-engine/logic";
import { buildBehavior } from "../../../packages/design-engine/behavior";
import { buildDesignGraph } from "../../../packages/design-engine/design-graph";

export function injectDesign(req: any, res: any, next: any) {
  const blueprint = req.blueprint;

  const logic = buildLogic(blueprint);
  const behavior = buildBehavior(logic);
  const graph = buildDesignGraph(behavior);

  req.design = {
    designId: crypto.randomUUID(),
    logic,
    behavior,
    designGraph: graph,
    createdAt: Date.now()
  };

  next();
}
