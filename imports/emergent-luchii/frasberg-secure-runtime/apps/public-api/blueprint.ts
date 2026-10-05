import { executeBlueprint } from "../engine-server/blueprint-execute";

export async function blueprint(req: any, res: any) {
  const b = req.blueprint;
  const input = req.body?.input;

  const result = await executeBlueprint(b, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
