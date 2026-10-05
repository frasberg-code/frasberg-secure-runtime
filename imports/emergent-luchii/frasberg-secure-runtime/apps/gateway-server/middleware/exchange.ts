import crypto from "crypto";
import { buildFlow } from "../../../packages/exchange-engine/flow";
import { buildMechanic } from "../../../packages/exchange-engine/mechanic";
import { buildExchangeGraph } from "../../../packages/exchange-engine/exchange-graph";

export function injectExchange(req: any, res: any, next: any) {
  const interaction = req.interaction;

  const flow = buildFlow(interaction);
  const mechanic = buildMechanic(flow);
  const graph = buildExchangeGraph(mechanic);

  req.exchange = {
    exchangeId: crypto.randomUUID(),
    flow,
    mechanic,
    exchangeGraph: graph,
    createdAt: Date.now()
  };

  next();
}
