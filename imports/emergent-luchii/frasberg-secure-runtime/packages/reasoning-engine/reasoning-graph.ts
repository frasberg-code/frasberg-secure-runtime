export function buildReasoningGraph(interpretation: any) {
  return {
    nodes: [
      { id: "cognition", weight: interpretation.structuralInterpretation === "understood" ? 1 : 0 },
      { id: "interpretation", weight: interpretation.harmonyInterpretation === "meaningful" ? 1 : 0 }
    ],
    edges: [
      { from: "cognition", to: "interpretation", relation: "construes" }
    ]
  };
}
