export function buildSyncGraph(rhythm: any) {
  return {
    nodes: [
      { id: "timing", weight: rhythm.structuralRhythm === "synchronized" ? 1 : 0 },
      { id: "rhythm", weight: rhythm.harmonyRhythm === "in-rhythm" ? 1 : 0 }
    ],
    edges: [
      { from: "timing", to: "rhythm", relation: "aligns" }
    ]
  };
}
