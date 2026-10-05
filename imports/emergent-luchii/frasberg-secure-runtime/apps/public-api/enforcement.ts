import { executeEnforcement } from "../engine-server/enforcement-execute";

export async function enforcement(req: any, res: any) {
  const enf = req.enforcement;
  const input = req.body?.input;

  const result = await executeEnforcement(enf, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
