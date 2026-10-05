import crypto from "crypto";
import { buildMindspace } from "../../../packages/mind-engine/mindspace";
import { buildMindField } from "../../../packages/mind-engine/field";
import { buildMindGraph } from "../../../packages/mind-engine/mind-graph";

export function injectMind(req: any, res: any, next: any) {
  const cognition = req.cognition;

  const mindspace = buildMindspace(cognition);
  const field = buildMindField(mindspace);
  const graph = buildMindGraph(field);

  req.mind = {
    mindId: crypto.randomUUID(),
    mindspace,
    field,
    mindGraph: graph,
    createdAt: Date.now()
  };

  next();
}
