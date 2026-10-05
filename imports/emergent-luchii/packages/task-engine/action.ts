export function buildAction(func) {
  return {
    functionAction: func.execution,
    dynamicsAction: func.dynamics,
    timestamp: Date.now()
  };
}
