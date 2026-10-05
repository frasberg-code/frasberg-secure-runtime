export function buildZeroGraph(singularity: any) {
  return {
    nodes: [
      { id: "zero", weight: singularity.stability },
      { id: "anchor", weight: singularity.coherence }
    ],
    edges: [
      { from: "zero", to: "anchor", relation: "binds" }
    ]
  };
}
