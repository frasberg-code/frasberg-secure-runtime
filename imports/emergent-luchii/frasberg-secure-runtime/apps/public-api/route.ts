import { executeRoute } from "../engine-server/route-execute";

export async function route(req: any, res: any) {
  const r = req.route;
  const input = req.body?.input;

  const result = await executeRoute(r, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
