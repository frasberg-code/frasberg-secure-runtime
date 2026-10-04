import { executeField } from "../engine-server/field-execute";

export async function field(req: any, res: any) {
  const f = req.field;
  const input = req.body?.input;

  const result = await executeField(f, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
