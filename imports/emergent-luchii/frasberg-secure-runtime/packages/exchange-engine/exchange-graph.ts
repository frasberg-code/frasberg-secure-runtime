export function buildExchangeGraph(mechanic: any) {
  return {
    nodes: [
      { id: "flow", weight: mechanic.structuralMechanic === "operational" ? 1 : 0 },
      { id: "mechanic", weight: mechanic.harmonyMechanic === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "flow", to: "mechanic", relation: "drives" }
    ]
  };
}
