import crypto from "crypto";
import { buildBaseline } from "../../../packages/zeropoint-engine/baseline";
import { buildSingularity } from "../../../packages/zeropoint-engine/singularity";
import { buildZeroGraph } from "../../../packages/zeropoint-engine/zero-graph";

export function injectZeroPoint(req: any, res: any, next: any) {
  const baseline = buildBaseline();
  const singularity = buildSingularity(baseline);
  const graph = buildZeroGraph(singularity);

  req.zero = {
    zeroId: crypto.randomUUID(),
    baseline,
    singularity,
    zeroGraph: graph,
    createdAt: Date.now()
  };

  next();
}
