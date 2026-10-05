export function buildArchitectureGraph(design: any) {
  return {
    nodes: [
      { id: "blueprint", weight: design.structuralDesign === "aligned" ? 1 : 0 },
      { id: "design", weight: design.harmonyDesign === "coherent" ? 1 : 0 }
    ],
    edges: [
      { from: "blueprint", to: "design", relation: "defines" }
    ]
  };
}
