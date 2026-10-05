export function buildRhythmGraph(beat: any) {
  return {
    nodes: [
      { id: "pulse", weight: beat.structuralBeat === "steady" ? 1 : 0 },
      { id: "beat", weight: beat.harmonyBeat === "smooth" ? 1 : 0 }
    ],
    edges: [
      { from: "pulse", to: "beat", relation: "drives" }
    ]
  };
}
