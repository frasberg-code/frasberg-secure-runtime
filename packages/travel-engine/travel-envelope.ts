import { Travel } from "./travel-model";

export function buildTravelEnvelope(travel: Travel) {
  return {
    travelId: travel.travelId,
    motion: travel.motion,
    behavior: travel.behavior,
    travelGraph: travel.travelGraph,
    timestamp: Date.now()
  };
}
