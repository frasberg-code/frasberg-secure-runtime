export function buildRoute(map: any) {
  return {
    structuralRoute: map.directionMap.pathwayDirection.structuralPathway === "open" ? "valid" : "invalid",
    harmonyRoute: map.routingMap.harmonyRouting === "smooth" ? "stable" : "unstable",
    checksum: Math.random().toString(36).slice(2)
  };
}
