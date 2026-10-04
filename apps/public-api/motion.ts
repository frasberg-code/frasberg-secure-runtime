import { executeMotion } from "../engine-server/motion-execute";

export async function motion(req: any, res: any) {
  const m = req.motion;
  const input = req.body?.input;

  const result = await executeMotion(m, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
