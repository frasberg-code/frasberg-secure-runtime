import { executeFunction } from '../engine-server/function-execute';

export async function func(req: any, res: any) {
  const result = await executeFunction(req.func, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
