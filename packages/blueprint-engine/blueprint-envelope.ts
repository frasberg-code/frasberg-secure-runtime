import { Blueprint } from "./blueprint-model";

export function buildBlueprintEnvelope(blueprint: Blueprint) {
  return {
    blueprintId: blueprint.blueprintId,
    plan: blueprint.plan,
    map: blueprint.map,
    blueprintGraph: blueprint.blueprintGraph,
    timestamp: Date.now()
  };
}
