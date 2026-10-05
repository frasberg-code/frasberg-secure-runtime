import { executeFlow } from "../engine-server/flow-execute";

export async function flow(req: any, res: any) {
  const f = req.flow;
  const input = req.body?.input;

  const result = await executeFlow(f, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
