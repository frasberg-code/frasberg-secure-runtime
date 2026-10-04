import { executeCirculation } from "../engine-server/circulation-execute";

export async function circulation(req: any, res: any) {
  const c = req.circulation;
  const input = req.body?.input;

  const result = await executeCirculation(c, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
