import { executeCharacter } from '../engine-server/character-execute';

export async function character(req: any, res: any) {
  const result = await executeCharacter(req.character, req.body?.input);

  res.json({
    version: '1.0',
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now(),
  });
}
