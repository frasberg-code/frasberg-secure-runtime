import { evolveFunction } from '../../packages/function-engine/evolve';

export async function executeFunction(func: any, input: any) {
  const evolution = evolveFunction(func);

  return {
    functionId: func.functionId,
    evolution,
    output: `Function processed: ${input}`,
  };
}
