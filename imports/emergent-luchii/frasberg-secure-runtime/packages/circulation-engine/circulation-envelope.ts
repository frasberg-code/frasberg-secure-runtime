import { Circulation } from "./circulation-model";

export function buildCirculationEnvelope(circulation: Circulation) {
  return {
    circulationId: circulation.circulationId,
    transport: circulation.transport,
    conduit: circulation.conduit,
    circulationGraph: circulation.circulationGraph,
    timestamp: Date.now()
  };
}
