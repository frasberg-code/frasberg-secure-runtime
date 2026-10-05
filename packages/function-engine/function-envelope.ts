export function buildFunctionEnvelope(func) {
  return {
    functionId: func.functionId,
    execution: func.execution,
    dynamics: func.dynamics,
    functionGraph: func.functionGraph,
    timestamp: Date.now()
  };
}
