import crypto from "crypto";
import { applyRules } from "../../../packages/enforcement-engine/rules";
import { propagateConstraints } from "../../../packages/enforcement-engine/propagation";
import { buildEnforcementGraph } from "../../../packages/enforcement-engine/enforcement-graph";

export function injectEnforcement(req: any, res: any, next: any) {
  const law = req.law;

  const appliedRules = applyRules(law);
  const propagation = propagateConstraints(appliedRules);
  const graph = buildEnforcementGraph(propagation);

  req.enforcement = {
    enforcementId: crypto.randomUUID(),
    appliedRules,
    propagation,
    enforcementGraph: graph,
    createdAt: Date.now()
  };

  next();
}
