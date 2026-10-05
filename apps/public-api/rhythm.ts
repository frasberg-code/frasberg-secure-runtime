import { executeRhythm } from "../engine-server/rhythm-execute";

export async function rhythm(req: any, res: any) {
  const r = req.rhythm;
  const input = req.body?.input;

  const result = await executeRhythm(r, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
