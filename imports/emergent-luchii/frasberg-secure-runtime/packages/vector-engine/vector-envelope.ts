import { Vector } from "./vector-model";

export function buildVectorEnvelope(vector: Vector) {
  return {
    vectorId: vector.vectorId,
    direction: vector.direction,
    field: vector.field,
    vectorGraph: vector.vectorGraph,
    timestamp: Date.now()
  };
}
