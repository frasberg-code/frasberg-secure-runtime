export function evolveTravel(travel: any) {
  return {
    travelId: travel.travelId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
