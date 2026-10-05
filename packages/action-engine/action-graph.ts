export function buildActionGraph(dynamics: any) {
  return {
    nodes: [
      { id: "motion", weight: dynamics.structuralActionDynamics === "in_motion" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyActionDynamics === "stable" ? 1 : 0 }
    ],
    edges: [{ from: "motion", to: "dynamics", relation: "drives" }]
  };
}
