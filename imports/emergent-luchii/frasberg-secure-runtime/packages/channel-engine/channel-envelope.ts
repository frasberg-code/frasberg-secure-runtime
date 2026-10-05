import { ChannelEngine } from "./channel-model";

export function buildChannelEnvelope(channel: ChannelEngine) {
  return {
    channelId: channel.channelId,
    direction: channel.direction,
    routing: channel.routing,
    channelGraph: channel.channelGraph,
    timestamp: Date.now()
  };
}
