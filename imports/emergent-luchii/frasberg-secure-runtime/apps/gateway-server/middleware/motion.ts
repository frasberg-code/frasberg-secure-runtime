import crypto from "crypto";
import { buildKinetics } from "../../../packages/motion-engine/kinetics";
import { buildDynamics } from "../../../packages/motion-engine/dynamics";
import { buildMotionGraph } from "../../../packages/motion-engine/motion-graph";

export function injectMotion(req: any, res: any, next: any) {
  const travel = req.travel;

  const kinetics = buildKinetics(travel);
  const dynamics = buildDynamics(kinetics);
  const graph = buildMotionGraph(dynamics);

  req.motion = {
    motionId: crypto.randomUUID(),
    kinetics,
    dynamics,
    motionGraph: graph,
    createdAt: Date.now()
  };

  next();
}
