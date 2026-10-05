export function buildBehaviorGraph(dynamics) {
  return {
    nodes: [
      { id: "pattern", weight: dynamics.structuralBehaviorDynamics === "emergent" ? 1 : 0 },
      { id: "dynamics", weight: dynamics.harmonyBehaviorDynamics === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "pattern", to: "dynamics", relation: "produces" }
    ]
  };
}
