export function buildBedrockGraph(matrix: any) {
  return {
    nodes: [
      { id: "ground", weight: matrix.stabilityField },
      { id: "matrix", weight: matrix.coherenceField }
    ],
    edges: [
      { from: "ground", to: "matrix", relation: "supports" }
    ]
  };
}
