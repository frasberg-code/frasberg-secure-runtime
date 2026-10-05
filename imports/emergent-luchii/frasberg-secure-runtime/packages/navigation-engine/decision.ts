export function buildDecision(route: any) {
  return {
    routeDecision: route.navigation,
    directiveDecision: route.directive,
    timestamp: Date.now()
  };
}
