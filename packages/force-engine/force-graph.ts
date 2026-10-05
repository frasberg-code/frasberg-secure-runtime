export function buildForceGraph(pressure: any) {
  return {
    nodes: [
      { id: "vector", weight: pressure.structuralPressure === "applied" ? 1 : 0 },
      { id: "pressure", weight: pressure.harmonyPressure === "balanced" ? 1 : 0 }
    ],
    edges: [
      { from: "vector", to: "pressure", relation: "influences" }
    ]
  };
}
