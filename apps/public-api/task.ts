import { executeTask } from '../engine-server/task-execute';

export async function task(req: any, res: any) {
  const result = await executeTask(req.task, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
