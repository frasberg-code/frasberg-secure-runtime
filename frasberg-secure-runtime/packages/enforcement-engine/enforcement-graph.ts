export function buildEnforcementGraph(propagation: any) {
  return {
    nodes: [
      { id: "rules", weight: propagation.consistencyPropagation ? 1 : 0 },
      { id: "propagation", weight: propagation.invariantPropagation ? 1 : 0 }
    ],
    edges: [
      { from: "rules", to: "propagation", relation: "propagates" }
    ]
  };
}
