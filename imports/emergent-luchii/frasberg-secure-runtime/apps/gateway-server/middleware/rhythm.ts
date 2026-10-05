import crypto from "crypto";
import { buildPulse } from "../../../packages/rhythm-engine/pulse";
import { buildBeat } from "../../../packages/rhythm-engine/beat";
import { buildRhythmGraph } from "../../../packages/rhythm-engine/rhythm-graph";

export function injectRhythm(req: any, res: any, next: any) {
  const sync = req.sync;

  const pulse = buildPulse(sync);
  const beat = buildBeat(pulse);
  const graph = buildRhythmGraph(beat);

  req.rhythm = {
    rhythmId: crypto.randomUUID(),
    pulse,
    beat,
    rhythmGraph: graph,
    createdAt: Date.now()
  };

  next();
}
