import { executeCognition } from "../engine-server/cognition-execute";

export async function cognition(req: any, res: any) {
  const c = req.cognition;
  const input = req.body?.input;

  const result = await executeCognition(c, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
