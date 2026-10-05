import { executeVector } from "../engine-server/vector-execute";

export async function vector(req: any, res: any) {
  const v = req.vector;
  const input = req.body?.input;

  const result = await executeVector(v, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
