import { evolveTruth } from "../../packages/groundtruth-engine/evolve";

export async function executeGroundTruth(truth: any, input: any) {
  const evolution = evolveTruth(truth);

  return {
    truthId: truth.truthId,
    evolution,
    output: `GroundTruth processed: ${input}`
  };
}
