export function buildStructureGraph(dynamics) {
  return {
    nodes: [
      { id: "formation", weight: dynamics.structuralStructuralDynamics === "structured" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyStructuralDynamics === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "formation", to: "dynamics", relation: "stabilizes" }
    ]
  };
}
