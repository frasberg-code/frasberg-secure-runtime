import { executeGroundTruth } from "../engine-server/groundtruth-execute";

export async function groundtruth(req: any, res: any) {
  const truth = req.groundtruth;
  const input = req.body?.input;

  const result = await executeGroundTruth(truth, input);

  res.json({
    version: "1.0",
    owner: req.ownerId,
    continuity: req.continuityState,
    diagnostics: req.diagnostics,
    payload: result,
    timestamp: Date.now()
  });
}
