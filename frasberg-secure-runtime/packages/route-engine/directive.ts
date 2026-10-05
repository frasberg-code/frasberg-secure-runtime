export function buildDirective(navigation: any) {
  return {
    structuralDirective: navigation.pathNavigation.directionMap.pathwayDirection.structuralPathway === "open" ? "proceed" : "stop",
    harmonyDirective: navigation.routeNavigation.harmonyRoute === "stable" ? "steady" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
