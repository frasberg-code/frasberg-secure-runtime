import { executeConsciousness } from "../engine-server/consciousness-execute";

export async function consciousness(req: any, res: any) {
  const cons = req.consciousness;
  const input = req.body?.input;

  const result = await executeConsciousness(cons, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
