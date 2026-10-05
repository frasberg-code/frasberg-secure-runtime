export function buildInfluence(vector: any) {
  return {
    vectorInfluence: vector.direction,
    fieldInfluence: vector.field,
    timestamp: Date.now()
  };
}
