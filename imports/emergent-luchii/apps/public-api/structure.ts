import { executeStructure } from "../../apps/engine-server/structure-execute";

export async function structure(req, res) {
  const structure = req.structure;
  const input = req.body.input;

  const result = await executeStructure(structure, input);

  res.json(result);
}
