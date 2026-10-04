import { executeExchange } from "../engine-server/exchange-execute";

export async function exchange(req: any, res: any) {
  const ex = req.exchange;
  const input = req.body?.input;

  const result = await executeExchange(ex, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
