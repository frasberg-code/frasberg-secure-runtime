import { executeInfluence } from "../engine-server/influence-execute";

export async function influence(req: any, res: any) {
  const i = req.influence;
  const input = req.body?.input;

  const result = await executeInfluence(i, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
