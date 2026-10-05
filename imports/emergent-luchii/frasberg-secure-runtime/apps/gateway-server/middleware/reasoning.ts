import crypto from "crypto";
import { buildCognition } from "../../../packages/reasoning-engine/cognition";
import { buildInterpretation } from "../../../packages/reasoning-engine/interpretation";
import { buildReasoningGraph } from "../../../packages/reasoning-engine/reasoning-graph";

export function injectReasoning(req: any, res: any, next: any) {
  const logic = req.logic;

  const cognition = buildCognition(logic);
  const interpretation = buildInterpretation(cognition);
  const graph = buildReasoningGraph(interpretation);

  req.reasoning = {
    reasoningId: crypto.randomUUID(),
    cognition,
    interpretation,
    reasoningGraph: graph,
    createdAt: Date.now()
  };

  next();
}
