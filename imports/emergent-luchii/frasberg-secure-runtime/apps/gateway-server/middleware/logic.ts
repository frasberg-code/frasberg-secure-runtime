import crypto from "crypto";
import { buildReasoning } from "../../../packages/logic-engine/reasoning";
import { buildInference } from "../../../packages/logic-engine/inference";
import { buildLogicGraph } from "../../../packages/logic-engine/logic-graph";

export function injectLogic(req: any, res: any, next: any) {
  const design = req.design;

  const reasoning = buildReasoning(design);
  const inference = buildInference(reasoning);
  const graph = buildLogicGraph(inference);

  req.logic = {
    logicId: crypto.randomUUID(),
    reasoning,
    inference,
    logicGraph: graph,
    createdAt: Date.now()
  };

  next();
}
