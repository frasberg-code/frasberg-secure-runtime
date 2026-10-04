import { executeArchitecture } from "../engine-server/architecture-execute";

export async function architecture(req: any, res: any) {
  const a = req.architecture;
  const input = req.body?.input;

  const result = await executeArchitecture(a, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
