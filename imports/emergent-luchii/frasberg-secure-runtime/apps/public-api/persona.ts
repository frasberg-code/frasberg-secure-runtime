import { executePersona } from '../engine-server/persona-execute';

export async function persona(req: any, res: any) {
  const result = await executePersona(req.persona, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
