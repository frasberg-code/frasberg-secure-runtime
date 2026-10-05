import crypto from 'crypto';
import { buildAction } from '../../../packages/task-engine/action';
import { buildTaskDynamics } from '../../../packages/task-engine/dynamics';
import { buildTaskGraph } from '../../../packages/task-engine/task-graph';

export function injectTask(req: any, res: any, next: any) {
  const func = req.func;
  if (!func) {
    return res
      .status(400)
      .json({ error: 'Missing function for task construction' });
  }

  const action = buildAction(func);
  const dynamics = buildTaskDynamics(action);
  const graph = buildTaskGraph(dynamics);

  req.task = {
    taskId: crypto.randomUUID(),
    action,
    dynamics,
    taskGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
