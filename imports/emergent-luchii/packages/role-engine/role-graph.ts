export function buildRoleGraph(dynamics) {
  return {
    nodes: [
      { id: "function", weight: dynamics.structuralRoleDynamics === "active" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyRoleDynamics === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "function", to: "dynamics", relation: "drives" }
    ]
  };
}
