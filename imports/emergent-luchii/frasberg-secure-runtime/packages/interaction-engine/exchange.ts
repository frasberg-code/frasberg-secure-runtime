export function buildExchange(influence: any) {
  return {
    influenceExchange: influence.propagation,
    interactionExchange: influence.interaction,
    timestamp: Date.now()
  };
}
