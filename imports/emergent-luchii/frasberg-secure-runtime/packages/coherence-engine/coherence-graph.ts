export function buildCoherenceGraph(harmony: any) {
  return {
    nodes: [
      { id: "alignment", weight: harmony.structuralHarmony === "aligned" ? 1 : 0 },
      { id: "harmony", weight: harmony.propagationHarmony === "harmonized" ? 1 : 0 }
    ],
    edges: [
      { from: "alignment", to: "harmony", relation: "synchronizes" }
    ]
  };
}
