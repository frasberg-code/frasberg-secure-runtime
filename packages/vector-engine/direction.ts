export function buildDirection(force: any) {
  return {
    forceDirection: force.vector,
    pressureDirection: force.pressure,
    timestamp: Date.now()
  };
}
