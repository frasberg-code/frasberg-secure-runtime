export function buildPersonaGraph(projection: any) {
  return {
    nodes: [
      { id: "model", weight: projection.structuralProjection === "expressed" ? 1 : 0 },
      { id: "projection", weight: projection.harmonyProjection === "coherent" ? 1 : 0 }
    ],
    edges: [{ from: "model", to: "projection", relation: "projects" }]
  };
}
