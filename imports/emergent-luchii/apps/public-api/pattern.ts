import { executePattern } from "../../apps/engine-server/pattern-execute";

export async function pattern(req, res) {
  const pattern = req.pattern;
  const input = req.body.input;

  const result = await executePattern(pattern, input);

  res.json(result);
}
