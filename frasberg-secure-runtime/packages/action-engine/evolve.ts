import type { Action } from "./action-model";

export function evolveAction(action: Action) {
  return {
    actionId: action.actionId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
