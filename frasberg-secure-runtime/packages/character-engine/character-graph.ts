export function buildCharacterGraph(expression: any) {
  return {
    nodes: [
      { id: "formation", weight: expression.structuralExpression === "manifested" ? 1 : 0 },
      { id: "expression", weight: expression.harmonyExpression === "stable" ? 1 : 0 }
    ],
    edges: [{ from: "formation", to: "expression", relation: "expresses" }]
  };
}
