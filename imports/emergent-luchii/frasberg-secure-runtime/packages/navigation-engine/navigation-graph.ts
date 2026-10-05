export function buildNavigationGraph(travel: any) {
  return {
    nodes: [
      { id: "decision", weight: travel.structuralTravel === "go" ? 1 : 0 },
      { id: "travel", weight: travel.harmonyTravel === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "decision", to: "travel", relation: "executes" }
    ]
  };
}
