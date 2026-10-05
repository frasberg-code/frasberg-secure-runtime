import { executeCoherence } from "../engine-server/coherence-execute";

export async function coherence(req: any, res: any) {
  const coh = req.coherence;
  const input = req.body?.input;

  const result = await executeCoherence(coh, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
