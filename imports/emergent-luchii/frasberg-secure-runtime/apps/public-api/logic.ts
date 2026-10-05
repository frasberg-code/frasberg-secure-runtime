import { executeLogic } from "../engine-server/logic-execute";

export async function logic(req: any, res: any) {
  const l = req.logic;
  const input = req.body?.input;

  const result = await executeLogic(l, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
