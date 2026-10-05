import crypto from "crypto";
import { buildDirection } from "../../../packages/vector-engine/direction";
import { buildField } from "../../../packages/vector-engine/field";
import { buildVectorGraph } from "../../../packages/vector-engine/vector-graph";

export function injectVector(req: any, res: any, next: any) {
  const force = req.force;

  const direction = buildDirection(force);
  const field = buildField(direction);
  const graph = buildVectorGraph(field);

  req.vector = {
    vectorId: crypto.randomUUID(),
    direction,
    field,
    vectorGraph: graph,
    createdAt: Date.now()
  };

  next();
}
