export function buildBedrockGraph(floor: any) {
  return {
    nodes: [
      { id: "floor", weight: floor.stability },
      { id: "anchor", weight: floor.coherence }
    ],
    edges: [
      { from: "floor", to: "anchor", relation: "roots" }
    ]
  };
}
