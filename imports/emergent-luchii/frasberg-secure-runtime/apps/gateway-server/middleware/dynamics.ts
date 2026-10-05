import crypto from "crypto";
import { buildForce } from "../../../packages/dynamics-engine/force";
import { buildAcceleration } from "../../../packages/dynamics-engine/acceleration";
import { buildDynamicsGraph } from "../../../packages/dynamics-engine/dynamics-graph";

export function injectDynamics(req: any, res: any, next: any) {
  const motion = req.motion;

  const force = buildForce(motion);
  const acceleration = buildAcceleration(force);
  const graph = buildDynamicsGraph(acceleration);

  req.dynamics = {
    dynamicsId: crypto.randomUUID(),
    force,
    acceleration,
    dynamicsGraph: graph,
    createdAt: Date.now()
  };

  next();
}
