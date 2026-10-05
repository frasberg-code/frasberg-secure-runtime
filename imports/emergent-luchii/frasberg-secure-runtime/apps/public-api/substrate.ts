import { executeSubstrate } from "../engine-server/substrate-execute";

export async function substrate(req: any, res: any) {
  const substrate = req.substrate;
  const input = req.body?.input;

  const result = await executeSubstrate(substrate, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
