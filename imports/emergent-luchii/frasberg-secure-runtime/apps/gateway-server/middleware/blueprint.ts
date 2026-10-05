import crypto from "crypto";
import { buildPlan } from "../../../packages/blueprint-engine/plan";
import { buildBlueprintMap } from "../../../packages/blueprint-engine/map";
import { buildBlueprintGraph } from "../../../packages/blueprint-engine/blueprint-graph";

export function injectBlueprint(req: any, res: any, next: any) {
  const architecture = req.architecture;

  const plan = buildPlan(architecture);
  const map = buildBlueprintMap(plan);
  const graph = buildBlueprintGraph(map);

  req.blueprint = {
    blueprintId: crypto.randomUUID(),
    plan,
    map,
    blueprintGraph: graph,
    createdAt: Date.now()
  };

  next();
}
