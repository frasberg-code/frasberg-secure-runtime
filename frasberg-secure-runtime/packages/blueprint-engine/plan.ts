export function buildPlan(architecture: any) {
  return {
    architecturePlan: architecture.blueprint,
    designPlan: architecture.design,
    timestamp: Date.now()
  };
}
