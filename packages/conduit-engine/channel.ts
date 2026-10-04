export function buildChannel(circulation: any) {
  return {
    transportChannel: circulation.transport,
    conduitChannel: circulation.conduit,
    timestamp: Date.now()
  };
}
