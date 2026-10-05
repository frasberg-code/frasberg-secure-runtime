export function buildCognitionGraph(dynamics: any) {
  return {
    nodes: [
      { id: "architecture", weight: dynamics.structuralDynamics === "engaged" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyDynamics === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "architecture", to: "dynamics", relation: "activates" }
    ]
  };
}
