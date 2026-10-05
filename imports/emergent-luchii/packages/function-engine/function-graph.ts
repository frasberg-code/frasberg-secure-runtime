export function buildFunctionGraph(dynamics) {
  return {
    nodes: [
      { id: "execution", weight: dynamics.structuralFunctionalDynamics === "operational" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyFunctionalDynamics === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "execution", to: "dynamics", relation: "produces" }
    ]
  };
}
