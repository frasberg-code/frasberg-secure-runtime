import { Conduit } from "./conduit-model";

export function buildConduitEnvelope(conduit: Conduit) {
  return {
    conduitId: conduit.conduitId,
    channel: conduit.channel,
    pathway: conduit.pathway,
    conduitGraph: conduit.conduitGraph,
    timestamp: Date.now()
  };
}
