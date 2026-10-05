import { executeAction } from '../engine-server/action-execute';

export async function action(req: any, res: any) {
  const result = await executeAction(req.action, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
