import crypto from "crypto";
import { buildMotion } from "../../../packages/travel-engine/motion";
import { buildBehavior } from "../../../packages/travel-engine/behavior";
import { buildTravelGraph } from "../../../packages/travel-engine/travel-graph";

export function injectTravel(req: any, res: any, next: any) {
  const navigation = req.navigation;

  const motion = buildMotion(navigation);
  const behavior = buildBehavior(motion);
  const graph = buildTravelGraph(behavior);

  req.travel = {
    travelId: crypto.randomUUID(),
    motion,
    behavior,
    travelGraph: graph,
    createdAt: Date.now()
  };

  next();
}
