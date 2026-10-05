export function buildMotionGraph(dynamics: any) {
  return {
    nodes: [
      { id: "kinetics", weight: dynamics.structuralDynamics === "active" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyDynamics === "fluid" ? 1 : 0 }
    ],
    edges: [
      { from: "kinetics", to: "dynamics", relation: "energizes" }
    ]
  };
}
