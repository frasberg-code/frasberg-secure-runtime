export function buildPattern(action) {
  return {
    actionPattern: action.motion,
    dynamicsPattern: action.dynamics,
    timestamp: Date.now()
  };
}
