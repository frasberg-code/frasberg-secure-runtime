import { executeLaw } from "../engine-server/law-execute";

export async function law(req: any, res: any) {
  const law = req.law;
  const input = req.body?.input;

  const result = await executeLaw(law, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
