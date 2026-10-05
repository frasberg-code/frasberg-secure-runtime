export function buildDirection(conduit: any) {
  return {
    pathwayDirection: conduit.pathway,
    channelDirection: conduit.channel,
    timestamp: Date.now()
  };
}
