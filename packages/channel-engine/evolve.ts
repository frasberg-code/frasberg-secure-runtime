export function evolveChannel(channel: any) {
  return {
    channelId: channel.channelId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
