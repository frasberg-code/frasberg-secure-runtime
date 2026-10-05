import crypto from "crypto";
import { buildVector } from "../../../packages/force-engine/vector";
import { buildPressure } from "../../../packages/force-engine/pressure";
import { buildForceGraph } from "../../../packages/force-engine/force-graph";

export function injectForce(req: any, res: any, next: any) {
  const dynamics = req.dynamics;

  const vector = buildVector(dynamics);
  const pressure = buildPressure(vector);
  const graph = buildForceGraph(pressure);

  req.force = {
    forceId: crypto.randomUUID(),
    vector,
    pressure,
    forceGraph: graph,
    createdAt: Date.now()
  };

  next();
}
