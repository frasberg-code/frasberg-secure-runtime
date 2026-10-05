import { executeStructure } from "../engine-server/structure-execute";

export async function structure(req: any, res: any) {
  const s = req.structure;
  const input = req.body?.input;

  const result = await executeStructure(s, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
