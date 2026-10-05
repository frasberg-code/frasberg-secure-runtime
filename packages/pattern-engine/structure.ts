export function buildStructure(exchange: any) {
  return {
    exchangeStructure: exchange.flow,
    mechanicStructure: exchange.mechanic,
    timestamp: Date.now()
  };
}
