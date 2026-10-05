export function evolveFlow(flow: any) {
  return {
    flowId: flow.flowId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
