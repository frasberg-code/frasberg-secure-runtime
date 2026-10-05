import { executeChannel } from "../engine-server/channel-execute";

export async function channel(req: any, res: any) {
  const ch = req.channel;
  const input = req.body?.input;

  const result = await executeChannel(ch, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
