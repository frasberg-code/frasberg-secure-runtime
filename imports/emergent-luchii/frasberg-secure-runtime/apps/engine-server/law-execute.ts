import { evolveLaw } from "../../packages/law-engine/evolve";

export async function executeLaw(law: any, input: any) {
  const evolution = evolveLaw(law);

  return {
    lawId: law.lawId,
    evolution,
    output: `Law processed: ${input}`
  };
}
