import { Sync } from "./sync-model";

export function buildSyncEnvelope(sync: Sync) {
  return {
    syncId: sync.syncId,
    timing: sync.timing,
    rhythm: sync.rhythm,
    syncGraph: sync.syncGraph,
    timestamp: Date.now()
  };
}
