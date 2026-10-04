import { executeDynamics } from "../engine-server/dynamics-execute";

export async function dynamics(req: any, res: any) {
  const d = req.dynamics;
  const input = req.body?.input;

  const result = await executeDynamics(d, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
