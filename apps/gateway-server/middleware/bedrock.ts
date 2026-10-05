import crypto from "crypto";
import { buildConstants } from "../../../packages/bedrock-engine/constants";
import { buildFloorState } from "../../../packages/bedrock-engine/floor";
import { buildBedrockGraph } from "../../../packages/bedrock-engine/bedrock-graph";

export function injectBedrock(req: any, res: any, next: any) {
  const constants = buildConstants();
  const floor = buildFloorState(constants);
  const graph = buildBedrockGraph(floor);

  req.bedrock = {
    bedrockId: crypto.randomUUID(),
    constants,
    floorState: floor,
    bedrockGraph: graph,
    createdAt: Date.now()
  };

  next();
}
