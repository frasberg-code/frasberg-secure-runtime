import { executeBehavior } from '../engine-server/behavior-execute';

export async function behavior(req: any, res: any) {
  const result = await executeBehavior(req.behavior, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
