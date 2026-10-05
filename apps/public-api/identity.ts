import { executeIdentity } from '../engine-server/identity-execute';

export async function identity(req: any, res: any) {
  const result = await executeIdentity(req.identity, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
