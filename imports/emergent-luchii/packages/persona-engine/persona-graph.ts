export function buildPersonaGraph(dynamics) {
  return {
    nodes: [
      { id: "model", weight: dynamics.structuralProjection === "expressed" ? 1 : 0 },
      { id: "projection", weight: dynamics.harmonyProjection === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "model", to: "projection", relation: "projects" }
    ]
  };
}
