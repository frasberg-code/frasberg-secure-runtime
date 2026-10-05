export function buildInteractionGraph(pattern: any) {
  return {
    nodes: [
      { id: "exchange", weight: pattern.structuralPattern === "connected" ? 1 : 0 },
      { id: "pattern", weight: pattern.harmonyPattern === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "exchange", to: "pattern", relation: "forms" }
    ]
  };
}
