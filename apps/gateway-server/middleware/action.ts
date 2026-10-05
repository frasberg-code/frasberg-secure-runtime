import crypto from 'crypto';
import { buildMotion } from '../../../packages/action-engine/motion';
import { buildActionDynamics } from '../../../packages/action-engine/dynamics';
import { buildActionGraph } from '../../../packages/action-engine/action-graph';

export function injectAction(req: any, res: any, next: any) {
  const task = req.task;
  if (!task) {
    return res
      .status(400)
      .json({ error: 'Missing task for action construction' });
  }

  const motion = buildMotion(task);
  const dynamics = buildActionDynamics(motion);
  const graph = buildActionGraph(dynamics);

  req.action = {
    actionId: crypto.randomUUID(),
    motion,
    dynamics,
    actionGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
