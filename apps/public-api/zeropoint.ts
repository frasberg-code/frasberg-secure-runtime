import { executeZero } from "../engine-server/zeropoint-execute";

export async function zeropoint(req: any, res: any) {
  const zero = req.zero;
  const input = req.body?.input;

  const result = await executeZero(zero, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
