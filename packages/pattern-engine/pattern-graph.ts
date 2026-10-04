export function buildPatternGraph(formation: any) {
  return {
    nodes: [
      { id: "structure", weight: formation.structuralFormation === "formed" ? 1 : 0 },
      { id: "formation", weight: formation.harmonyFormation === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "structure", to: "formation", relation: "creates" }
    ]
  };
}
