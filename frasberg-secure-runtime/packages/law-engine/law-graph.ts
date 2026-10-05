export function buildLawGraph(enforcement: any) {
  return {
    nodes: [
      { id: "constraint", weight: enforcement.consistencyCheck ? 1 : 0 },
      { id: "enforcement", weight: enforcement.invariantCheck ? 1 : 0 }
    ],
    edges: [
      { from: "constraint", to: "enforcement", relation: "enforces" }
    ]
  };
}
