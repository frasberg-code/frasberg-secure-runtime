import { Exchange } from "./exchange-model";

export function buildExchangeEnvelope(exchange: Exchange) {
  return {
    exchangeId: exchange.exchangeId,
    flow: exchange.flow,
    mechanic: exchange.mechanic,
    exchangeGraph: exchange.exchangeGraph,
    timestamp: Date.now()
  };
}
