export function buildChannelGraph(routing: any) {
  return {
    nodes: [
      { id: "direction", weight: routing.structuralRouting === "forward" ? 1 : 0 },
      { id: "routing", weight: routing.harmonyRouting === "smooth" ? 1 : 0 }
    ],
    edges: [
      { from: "direction", to: "routing", relation: "controls" }
    ]
  };
}
