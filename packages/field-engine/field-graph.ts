export function buildFieldGraph(topology: any) {
  return {
    nodes: [
      { id: "influence", weight: topology.structuralTopology === "active" ? 1 : 0 },
      { id: "topology", weight: topology.harmonyTopology === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "influence", to: "topology", relation: "shapes" }
    ]
  };
}
