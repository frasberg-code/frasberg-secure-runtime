export function buildReasoning(design: any) {
  return {
    designReasoning: design.logic,
    behaviorReasoning: design.behavior,
    timestamp: Date.now()
  };
}
