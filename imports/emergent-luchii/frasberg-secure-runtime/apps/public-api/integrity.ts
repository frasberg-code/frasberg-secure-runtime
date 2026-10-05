import { executeIntegrity } from "../engine-server/integrity-execute";

export async function integrity(req: any, res: any) {
  const integ = req.integrity;
  const input = req.body?.input;

  const result = await executeIntegrity(integ, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
