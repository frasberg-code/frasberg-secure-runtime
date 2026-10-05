import { executeStructure } from '../engine-server/structure-execute';

export async function engineStructure(req: any, res: any) {
  const result = await executeStructure(req.engineStructure, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
