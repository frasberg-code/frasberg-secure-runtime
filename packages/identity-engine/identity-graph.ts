export function buildIdentityGraph(integration: any) {
  return {
    nodes: [
      { id: "self", weight: integration.structuralIntegration === "integrated" ? 1 : 0 },
      { id: "integration", weight: integration.harmonyIntegration === "stable" ? 1 : 0 }
    ],
    edges: [{ from: "self", to: "integration", relation: "forms" }]
  };
}
