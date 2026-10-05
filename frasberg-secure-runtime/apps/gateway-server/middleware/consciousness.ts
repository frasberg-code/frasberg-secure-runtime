import crypto from "crypto";
import { buildAwareness } from "../../../packages/consciousness-engine/awareness";
import { buildConsciousField } from "../../../packages/consciousness-engine/field";
import { buildConsciousnessGraph } from "../../../packages/consciousness-engine/consciousness-graph";

export function injectConsciousness(req: any, res: any, next: any) {
  const mind = req.mind;

  const awareness = buildAwareness(mind);
  const field = buildConsciousField(awareness);
  const graph = buildConsciousnessGraph(field);

  req.consciousness = {
    consciousnessId: crypto.randomUUID(),
    awareness,
    field,
    consciousnessGraph: graph,
    createdAt: Date.now()
  };

  next();
}
