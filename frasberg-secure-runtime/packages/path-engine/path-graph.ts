export function buildPathGraph(route: any) {
  return {
    nodes: [
      { id: "map", weight: route.structuralRoute === "valid" ? 1 : 0 },
      { id: "route", weight: route.harmonyRoute === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "map", to: "route", relation: "defines" }
    ]
  };
}
