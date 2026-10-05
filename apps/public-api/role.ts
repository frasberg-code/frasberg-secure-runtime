import { executeRole } from '../engine-server/role-execute';

export async function role(req: any, res: any) {
  const result = await executeRole(req.role, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
