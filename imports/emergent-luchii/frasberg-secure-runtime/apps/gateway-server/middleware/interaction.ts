import crypto from "crypto";
import { buildExchange } from "../../../packages/interaction-engine/exchange";
import { buildPattern } from "../../../packages/interaction-engine/pattern";
import { buildInteractionGraph } from "../../../packages/interaction-engine/interaction-graph";

export function injectInteraction(req: any, res: any, next: any) {
  const influence = req.influence;

  const exchange = buildExchange(influence);
  const pattern = buildPattern(exchange);
  const graph = buildInteractionGraph(pattern);

  req.interaction = {
    interactionId: crypto.randomUUID(),
    exchange,
    pattern,
    interactionGraph: graph,
    createdAt: Date.now()
  };

  next();
}
