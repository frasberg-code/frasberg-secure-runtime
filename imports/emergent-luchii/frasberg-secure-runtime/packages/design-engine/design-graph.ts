export function buildDesignGraph(behavior: any) {
  return {
    nodes: [
      { id: "logic", weight: behavior.structuralBehavior === "active" ? 1 : 0 },
      { id: "behavior", weight: behavior.harmonyBehavior === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "logic", to: "behavior", relation: "produces" }
    ]
  };
}
