export function buildConduitGraph(pathway: any) {
  return {
    nodes: [
      { id: "channel", weight: pathway.structuralPathway === "open" ? 1 : 0 },
      { id: "pathway", weight: pathway.harmonyPathway === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "channel", to: "pathway", relation: "routes" }
    ]
  };
}
