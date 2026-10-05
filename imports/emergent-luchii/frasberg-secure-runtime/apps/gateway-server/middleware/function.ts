import crypto from 'crypto';
import { buildExecution } from '../../../packages/function-engine/execution';
import { buildFunctionalDynamics } from '../../../packages/function-engine/dynamics';
import { buildFunctionGraph } from '../../../packages/function-engine/function-graph';

export function injectFunction(req: any, res: any, next: any) {
  const role = req.role;
  if (!role) {
    return res
      .status(400)
      .json({ error: 'Missing role for function construction' });
  }

  const execution = buildExecution(role);
  const dynamics = buildFunctionalDynamics(execution);
  const graph = buildFunctionGraph(dynamics);

  req.func = {
    functionId: crypto.randomUUID(),
    execution,
    dynamics,
    functionGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
