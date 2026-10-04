export function buildStructureGraph(fabric: any) {
  return {
    nodes: [
      { id: "architecture", weight: fabric.structuralFabric === "woven" ? 1 : 0 },
      { id: "fabric", weight: fabric.harmonyFabric === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "architecture", to: "fabric", relation: "supports" }
    ]
  };
}
