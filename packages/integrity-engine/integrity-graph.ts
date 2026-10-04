export function buildIntegrityGraph(health: any) {
  return {
    nodes: [
      { id: "validation", weight: health.structuralHealth === "stable" ? 1 : 0 },
      { id: "health", weight: health.propagationHealth === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "validation", to: "health", relation: "supports" }
    ]
  };
}
