import crypto from "crypto";
import { buildPropagation } from "../../../packages/influence-engine/propagation";
import { buildInteraction } from "../../../packages/influence-engine/interaction";
import { buildInfluenceGraph } from "../../../packages/influence-engine/influence-graph";

export function injectInfluence(req: any, res: any, next: any) {
  const field = req.field;

  const propagation = buildPropagation(field);
  const interaction = buildInteraction(propagation);
  const graph = buildInfluenceGraph(interaction);

  req.influence = {
    influenceId: crypto.randomUUID(),
    propagation,
    interaction,
    influenceGraph: graph,
    createdAt: Date.now()
  };

  next();
}
