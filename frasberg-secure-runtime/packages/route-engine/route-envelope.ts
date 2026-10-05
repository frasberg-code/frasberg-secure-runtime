import { RouteEngine } from "./route-model";

export function buildRouteEnvelope(route: RouteEngine) {
  return {
    routeId: route.routeId,
    navigation: route.navigation,
    directive: route.directive,
    routeGraph: route.routeGraph,
    timestamp: Date.now()
  };
}
