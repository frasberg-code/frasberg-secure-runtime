import crypto from "crypto";
import { buildDecision } from "../../../packages/navigation-engine/decision";
import { buildTravel } from "../../../packages/navigation-engine/travel";
import { buildNavigationGraph } from "../../../packages/navigation-engine/navigation-graph";

export function injectNavigation(req: any, res: any, next: any) {
  const route = req.route;

  const decision = buildDecision(route);
  const travel = buildTravel(decision);
  const graph = buildNavigationGraph(travel);

  req.navigation = {
    navigationId: crypto.randomUUID(),
    decision,
    travel,
    navigationGraph: graph,
    createdAt: Date.now()
  };

  next();
}
