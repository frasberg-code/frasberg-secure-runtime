export function buildActionEnvelope(action) {
  return {
    actionId: action.actionId,
    motion: action.motion,
    dynamics: action.dynamics,
    actionGraph: action.actionGraph,
    timestamp: Date.now()
  };
}
