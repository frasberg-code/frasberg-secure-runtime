export function buildConsciousnessGraph(field: any) {
  return {
    nodes: [
      { id: "awareness", weight: field.structuralConsciousField === "aware" ? 1 : 0 },
      { id: "field", weight: field.harmonyConsciousField === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "awareness", to: "field", relation: "emerges" }
    ]
  };
}
