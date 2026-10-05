export function buildRouteGraph(directive: any) {
  return {
    nodes: [
      { id: "navigation", weight: directive.structuralDirective === "proceed" ? 1 : 0 },
      { id: "directive", weight: directive.harmonyDirective === "steady" ? 1 : 0 }
    ],
    edges: [
      { from: "navigation", to: "directive", relation: "drives" }
    ]
  };
}
