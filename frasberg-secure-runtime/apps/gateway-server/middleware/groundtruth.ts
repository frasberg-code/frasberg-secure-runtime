import crypto from "crypto";
import { buildLaws } from "../../../packages/groundtruth-engine/laws";
import { buildInvariants } from "../../../packages/groundtruth-engine/invariants";
import { buildTruthGraph } from "../../../packages/groundtruth-engine/truth-graph";

export function injectGroundTruth(req: any, res: any, next: any) {
  const laws = buildLaws();
  const invariants = buildInvariants(laws);
  const graph = buildTruthGraph(invariants);

  req.groundtruth = {
    truthId: crypto.randomUUID(),
    laws,
    invariants,
    truthGraph: graph,
    createdAt: Date.now()
  };

  next();
}
