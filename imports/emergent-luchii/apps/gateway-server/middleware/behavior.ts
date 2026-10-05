import crypto from "crypto";
import { buildPattern } from "../../../packages/behavior-engine/pattern";
import { buildBehaviorDynamics } from "../../../packages/behavior-engine/dynamics";
import { buildBehaviorGraph } from "../../../packages/behavior-engine/behavior-graph";

export function injectBehavior(req, res, next) {
  const action = req.action;

  const pattern = buildPattern(action);
  const dynamics = buildBehaviorDynamics(pattern);
  const graph = buildBehaviorGraph(dynamics);

  req.behavior = {
    behaviorId: crypto.randomUUID(),
    pattern,
    dynamics,
    behaviorGraph: graph,
    createdAt: Date.now()
  };

  next();
}
