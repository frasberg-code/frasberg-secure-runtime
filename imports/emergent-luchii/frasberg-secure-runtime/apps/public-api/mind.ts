import { executeMind } from "../engine-server/mind-execute";

export async function mind(req: any, res: any) {
  const m = req.mind;
  const input = req.body?.input;

  const result = await executeMind(m, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
