import { executeConduit } from "../engine-server/conduit-execute";

export async function conduit(req: any, res: any) {
  const c = req.conduit;
  const input = req.body?.input;

  const result = await executeConduit(c, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
