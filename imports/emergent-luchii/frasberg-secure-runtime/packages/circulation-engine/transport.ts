export function buildTransport(flow: any) {
  return {
    flowTransport: flow.circulation,
    movementTransport: flow.movement,
    timestamp: Date.now()
  };
}
