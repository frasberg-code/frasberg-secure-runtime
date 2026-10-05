import { evolveTravel } from "../../packages/travel-engine/evolve";

export async function executeTravel(travel: any, input: any) {
  const evolution = evolveTravel(travel);

  return {
    travelId: travel.travelId,
    evolution,
    output: `Travel processed: ${input}`
  };
}
