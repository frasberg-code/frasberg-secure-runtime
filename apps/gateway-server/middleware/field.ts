import crypto from "crypto";
import { buildInfluence } from "../../../packages/field-engine/influence";
import { buildTopology } from "../../../packages/field-engine/topology";
import { buildFieldGraph } from "../../../packages/field-engine/field-graph";

export function injectField(req: any, res: any, next: any) {
  const vector = req.vector;

  const influence = buildInfluence(vector);
  const topology = buildTopology(influence);
  const graph = buildFieldGraph(topology);

  req.field = {
    fieldId: crypto.randomUUID(),
    influence,
    topology,
    fieldGraph: graph,
    createdAt: Date.now()
  };

  next();
}
