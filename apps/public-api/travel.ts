import { executeTravel } from "../engine-server/travel-execute";

export async function travel(req: any, res: any) {
  const t = req.travel;
  const input = req.body?.input;

  const result = await executeTravel(t, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
