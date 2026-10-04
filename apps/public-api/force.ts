import { executeForce } from "../engine-server/force-execute";

export async function force(req: any, res: any) {
  const f = req.force;
  const input = req.body?.input;

  const result = await executeForce(f, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
