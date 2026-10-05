import crypto from "crypto";
import { buildGroundState } from "../../../packages/substrate-engine/ground";
import { buildMatrix } from "../../../packages/substrate-engine/matrix";
import { buildBedrockGraph } from "../../../packages/substrate-engine/bedrock-graph";

export function injectSubstrate(req: any, res: any, next: any) {
  const ground = buildGroundState();
  const matrix = buildMatrix(ground);
  const graph = buildBedrockGraph(matrix);

  req.substrate = {
    substrateId: crypto.randomUUID(),
    groundState: ground,
    matrix,
    bedrockGraph: graph,
    createdAt: Date.now()
  };

  next();
}
