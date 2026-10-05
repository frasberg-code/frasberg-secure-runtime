export function buildPatternGraph(dynamics) {
  return {
    nodes: [
      { id: "structure", weight: dynamics.structuralPatternDynamics === "patterned" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyPatternDynamics === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "structure", to: "dynamics", relation: "shapes" }
    ]
  };
}
