export function buildBlueprintGraph(map: any) {
  return {
    nodes: [
      { id: "plan", weight: map.structuralMap === "mapped" ? 1 : 0 },
      { id: "map", weight: map.harmonyMap === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "plan", to: "map", relation: "defines" }
    ]
  };
}
