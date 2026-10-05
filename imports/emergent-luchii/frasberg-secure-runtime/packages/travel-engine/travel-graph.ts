export function buildTravelGraph(behavior: any) {
  return {
    nodes: [
      { id: "motion", weight: behavior.structuralBehavior === "moving" ? 1 : 0 },
      { id: "behavior", weight: behavior.harmonyBehavior === "smooth" ? 1 : 0 }
    ],
    edges: [
      { from: "motion", to: "behavior", relation: "animates" }
    ]
  };
}
