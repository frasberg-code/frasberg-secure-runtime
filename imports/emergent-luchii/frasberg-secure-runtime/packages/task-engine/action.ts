export function buildAction(func: any) {
  return {
    functionAction: func.execution,
    dynamicsAction: func.dynamics,
    timestamp: Date.now()
  };
}
