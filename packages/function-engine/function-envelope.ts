import type { Func } from "./function-model";

export function buildFunctionEnvelope(func: Func) {
  return {
    functionId: func.functionId,
    execution: func.execution,
    dynamics: func.dynamics,
    functionGraph: func.functionGraph,
    timestamp: Date.now()
  };
}
