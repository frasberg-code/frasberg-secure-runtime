import type { Action } from "./action-model";

export function buildActionEnvelope(action: Action) {
  return {
    actionId: action.actionId,
    motion: action.motion,
    dynamics: action.dynamics,
    actionGraph: action.actionGraph,
    timestamp: Date.now()
  };
}
