import { Substrate } from "./substrate-model";

export function buildSubstrateEnvelope(substrate: Substrate) {
  return {
    substrateId: substrate.substrateId,
    groundState: substrate.groundState,
    matrix: substrate.matrix,
    bedrockGraph: substrate.bedrockGraph,
    timestamp: Date.now()
  };
}
