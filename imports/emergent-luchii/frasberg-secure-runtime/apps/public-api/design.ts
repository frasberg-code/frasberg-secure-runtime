import { executeDesign } from "../engine-server/design-execute";

export async function design(req: any, res: any) {
  const d = req.design;
  const input = req.body?.input;

  const result = await executeDesign(d, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
