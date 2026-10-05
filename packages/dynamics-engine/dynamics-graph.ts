export function buildDynamicsGraph(acceleration: any) {
  return {
    nodes: [
      { id: "force", weight: acceleration.structuralAcceleration === "accelerating" ? 1 : 0 },
      { id: "acceleration", weight: acceleration.harmonyAcceleration === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "force", to: "acceleration", relation: "drives" }
    ]
  };
}
