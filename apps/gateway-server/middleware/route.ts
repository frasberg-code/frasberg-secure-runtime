import crypto from "crypto";
import { buildNavigation } from "../../../packages/route-engine/navigation";
import { buildDirective } from "../../../packages/route-engine/directive";
import { buildRouteGraph } from "../../../packages/route-engine/route-graph";

export function injectRoute(req: any, res: any, next: any) {
  const path = req.path;

  const navigation = buildNavigation(path);
  const directive = buildDirective(navigation);
  const graph = buildRouteGraph(directive);

  req.route = {
    routeId: crypto.randomUUID(),
    navigation,
    directive,
    routeGraph: graph,
    createdAt: Date.now()
  };

  next();
}
