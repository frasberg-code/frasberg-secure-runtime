import { evolveCirculation } from "../../packages/circulation-engine/evolve";

export async function executeCirculation(circulation: any, input: any) {
  const evolution = evolveCirculation(circulation);

  return {
    circulationId: circulation.circulationId,
    evolution,
    output: `Circulation processed: ${input}`
  };
}
