export function buildFlowGraph(movement: any) {
  return {
    nodes: [
      { id: "circulation", weight: movement.structuralMovement === "flowing" ? 1 : 0 },
      { id: "movement", weight: movement.harmonyMovement === "smooth" ? 1 : 0 }
    ],
    edges: [
      { from: "circulation", to: "movement", relation: "drives" }
    ]
  };
}
