export function buildLogicGraph(inference: any) {
  return {
    nodes: [
      { id: "reasoning", weight: inference.structuralInference === "deduced" ? 1 : 0 },
      { id: "inference", weight: inference.harmonyInference === "valid" ? 1 : 0 }
    ],
    edges: [
      { from: "reasoning", to: "inference", relation: "concludes" }
    ]
  };
}
