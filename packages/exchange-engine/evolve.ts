export function evolveExchange(exchange: any) {
  return {
    exchangeId: exchange.exchangeId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
