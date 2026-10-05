import { Bedrock } from "./bedrock-model";

export function buildBedrockEnvelope(bedrock: Bedrock) {
  return {
    bedrockId: bedrock.bedrockId,
    constants: bedrock.constants,
    floorState: bedrock.floorState,
    bedrockGraph: bedrock.bedrockGraph,
    timestamp: Date.now()
  };
}
