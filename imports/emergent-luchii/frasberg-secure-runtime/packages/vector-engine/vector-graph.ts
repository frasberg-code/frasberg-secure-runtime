export function buildVectorGraph(field: any) {
  return {
    nodes: [
      { id: "direction", weight: field.structuralField === "directed" ? 1 : 0 },
      { id: "field", weight: field.harmonyField === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "direction", to: "field", relation: "influences" }
    ]
  };
}
