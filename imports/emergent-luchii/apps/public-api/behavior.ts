import { executeBehavior } from "../../apps/engine-server/behavior-execute";

export async function behavior(req, res) {
  const behavior = req.behavior;
  const input = req.body.input;

  const result = await executeBehavior(behavior, input);

  res.json(result);
}
