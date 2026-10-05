export function buildTruthGraph(invariants: any) {
  return {
    nodes: [
      { id: "law", weight: invariants.immutability ? 1 : 0 },
      { id: "invariant", weight: invariants.consistency ? 1 : 0 }
    ],
    edges: [
      { from: "law", to: "invariant", relation: "governs" }
    ]
  };
}
