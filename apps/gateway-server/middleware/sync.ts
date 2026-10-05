import crypto from "crypto";
import { buildTiming } from "../../../packages/sync-engine/timing";
import { buildRhythm } from "../../../packages/sync-engine/rhythm";
import { buildSyncGraph } from "../../../packages/sync-engine/sync-graph";

export function injectSync(req: any, res: any, next: any) {
  const coherence = req.coherence;

  const timing = buildTiming(coherence);
  const rhythm = buildRhythm(timing);
  const graph = buildSyncGraph(rhythm);

  req.sync = {
    syncId: crypto.randomUUID(),
    timing,
    rhythm,
    syncGraph: graph,
    createdAt: Date.now()
  };

  next();
}
