export function buildMap(channel: any) {
  return {
    directionMap: channel.direction,
    routingMap: channel.routing,
    timestamp: Date.now()
  };
}
