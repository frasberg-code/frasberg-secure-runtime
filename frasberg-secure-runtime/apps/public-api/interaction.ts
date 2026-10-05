import { executeInteraction } from "../engine-server/interaction-execute";

export async function interaction(req: any, res: any) {
  const inter = req.interaction;
  const input = req.body?.input;

  const result = await executeInteraction(inter, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
