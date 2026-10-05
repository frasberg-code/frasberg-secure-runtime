import { executePath } from "../engine-server/path-execute";

export async function path(req: any, res: any) {
  const p = req.path;
  const input = req.body?.input;

  const result = await executePath(p, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
