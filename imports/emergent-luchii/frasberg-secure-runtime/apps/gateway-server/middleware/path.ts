import crypto from "crypto";
import { buildMap } from "../../../packages/path-engine/map";
import { buildRoute } from "../../../packages/path-engine/route";
import { buildPathGraph } from "../../../packages/path-engine/path-graph";

export function injectPath(req: any, res: any, next: any) {
  const channel = req.channel;

  const map = buildMap(channel);
  const route = buildRoute(map);
  const graph = buildPathGraph(route);

  req.path = {
    pathId: crypto.randomUUID(),
    map,
    route,
    pathGraph: graph,
    createdAt: Date.now()
  };

  next();
}
