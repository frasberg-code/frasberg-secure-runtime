import { executePattern } from "../engine-server/pattern-execute";

export async function pattern(req: any, res: any) {
  const p = req.pattern;
  const input = req.body?.input;

  const result = await executePattern(p, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
