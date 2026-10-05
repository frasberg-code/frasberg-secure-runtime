export function buildVector(dynamics: any) {
  return {
    dynamicsVector: dynamics.force,
    accelerationVector: dynamics.acceleration,
    timestamp: Date.now()
  };
}
