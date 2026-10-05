export function buildPattern(action: any) {
  return {
    actionPattern: action.motion,
    dynamicsPattern: action.dynamics,
    timestamp: Date.now()
  };
}
