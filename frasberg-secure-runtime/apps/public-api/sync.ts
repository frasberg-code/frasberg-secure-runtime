import { executeSync } from "../engine-server/sync-execute";

export async function sync(req: any, res: any) {
  const s = req.sync;
  const input = req.body?.input;

  const result = await executeSync(s, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
