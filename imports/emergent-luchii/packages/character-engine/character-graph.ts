export function buildCharacterGraph(dynamics) {
  return {
    nodes: [
      { id: "formation", weight: dynamics.structuralExpression === "manifested" ? 1 : 0 },
      { id: "expression", weight: dynamics.harmonyExpression === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "formation", to: "expression", relation: "expresses" }
    ]
  };
}
