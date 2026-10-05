export function buildInfluenceGraph(interaction: any) {
  return {
    nodes: [
      { id: "propagation", weight: interaction.structuralInteraction === "interactive" ? 1 : 0 },
      { id: "interaction", weight: interaction.harmonyInteraction === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "propagation", to: "interaction", relation: "modulates" }
    ]
  };
}
