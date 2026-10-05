import { executeBedrock } from "../engine-server/bedrock-execute";

export async function bedrock(req: any, res: any) {
  const bedrock = req.bedrock;
  const input = req.body?.input;

  const result = await executeBedrock(bedrock, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
