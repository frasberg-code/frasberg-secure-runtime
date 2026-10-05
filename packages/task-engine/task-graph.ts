export function buildTaskGraph(dynamics) {
  return {
    nodes: [
      { id: "action", weight: dynamics.structuralTaskDynamics === "engaged" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyTaskDynamics === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "action", to: "dynamics", relation: "drives" }
    ]
  };
}
