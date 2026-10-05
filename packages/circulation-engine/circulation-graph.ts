export function buildCirculationGraph(conduit: any) {
  return {
    nodes: [
      { id: "transport", weight: conduit.structuralConduit === "open" ? 1 : 0 },
      { id: "conduit", weight: conduit.harmonyConduit === "clear" ? 1 : 0 }
    ],
    edges: [
      { from: "transport", to: "conduit", relation: "channels" }
    ]
  };
}
