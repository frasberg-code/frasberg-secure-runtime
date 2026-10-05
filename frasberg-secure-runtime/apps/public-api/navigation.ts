import { executeNavigation } from "../engine-server/navigation-execute";

export async function navigation(req: any, res: any) {
  const n = req.navigation;
  const input = req.body?.input;

  const result = await executeNavigation(n, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
