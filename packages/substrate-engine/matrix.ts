export function buildMatrix(ground: any) {
  return {
    anchor: ground.baseline,
    stabilityField: ground.stability,
    coherenceField: Math.random()
  };
}
