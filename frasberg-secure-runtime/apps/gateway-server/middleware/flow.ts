import crypto from "crypto";
import { buildCirculation } from "../../../packages/flow-engine/circulation";
import { buildMovement } from "../../../packages/flow-engine/movement";
import { buildFlowGraph } from "../../../packages/flow-engine/flow-graph";

export function injectFlow(req: any, res: any, next: any) {
  const rhythm = req.rhythm;

  const circulation = buildCirculation(rhythm);
  const movement = buildMovement(circulation);
  const graph = buildFlowGraph(movement);

  req.flow = {
    flowId: crypto.randomUUID(),
    circulation,
    movement,
    flowGraph: graph,
    createdAt: Date.now()
  };

  next();
}
