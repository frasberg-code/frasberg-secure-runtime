import { Path } from "./path-model";

export function buildPathEnvelope(path: Path) {
  return {
    pathId: path.pathId,
    map: path.map,
    route: path.route,
    pathGraph: path.pathGraph,
    timestamp: Date.now()
  };
}
