import crypto from "crypto";
import { buildConstraints } from "../../../packages/law-engine/constraints";
import { buildEnforcement } from "../../../packages/law-engine/enforcement";
import { buildLawGraph } from "../../../packages/law-engine/law-graph";

export function injectLaw(req: any, res: any, next: any) {
  const constraints = buildConstraints();
  const enforcement = buildEnforcement(constraints);
  const graph = buildLawGraph(enforcement);

  req.law = {
    lawId: crypto.randomUUID(),
    constraints,
    enforcement,
    lawGraph: graph,
    createdAt: Date.now()
  };

  next();
}
