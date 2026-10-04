export function buildKinetics(travel: any) {
  return {
    travelKinetics: travel.motion,
    behaviorKinetics: travel.behavior,
    timestamp: Date.now()
  };
}
