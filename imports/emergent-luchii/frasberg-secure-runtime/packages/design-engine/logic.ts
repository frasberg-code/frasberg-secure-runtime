export function buildLogic(blueprint: any) {
  return {
    blueprintLogic: blueprint.plan,
    mapLogic: blueprint.map,
    timestamp: Date.now()
  };
}
