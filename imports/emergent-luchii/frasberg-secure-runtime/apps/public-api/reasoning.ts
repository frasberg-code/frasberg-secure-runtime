import { executeReasoning } from "../engine-server/reasoning-execute";

export async function reasoning(req: any, res: any) {
  const r = req.reasoning;
  const input = req.body?.input;

  const result = await executeReasoning(r, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
