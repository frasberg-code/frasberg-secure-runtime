export function buildMindGraph(field: any) {
  return {
    nodes: [
      { id: "mindspace", weight: field.structuralField === "expanded" ? 1 : 0 },
      { id: "field", weight: field.harmonyField === "balanced" ? 1 : 0 }
    ],
    edges: [
      { from: "mindspace", to: "field", relation: "forms" }
    ]
  };
}
