export function buildIdentityGraph(integration) {
  return {
    nodes: [
      { id: "self", weight: 1 },
      { id: "integration", weight: integration.harmonyIntegration === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "self", to: "integration", relation: "integrates" }
    ]
  };
}
