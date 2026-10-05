import { executePattern } from '../engine-server/pattern-execute';

export async function enginePattern(req: any, res: any) {
  const result = await executePattern(req.enginePattern, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
