export function buildNavigation(path: any) {
  return {
    pathNavigation: path.map,
    routeNavigation: path.route,
    timestamp: Date.now()
  };
}
