import crypto from "crypto";
import { buildAlignment } from "../../../packages/coherence-engine/alignment";
import { buildHarmony } from "../../../packages/coherence-engine/harmony";
import { buildCoherenceGraph } from "../../../packages/coherence-engine/coherence-graph";

export function injectCoherence(req: any, res: any, next: any) {
  const integrity = req.integrity;

  const alignment = buildAlignment(integrity);
  const harmony = buildHarmony(alignment);
  const graph = buildCoherenceGraph(harmony);

  req.coherence = {
    coherenceId: crypto.randomUUID(),
    alignment,
    harmony,
    coherenceGraph: graph,
    createdAt: Date.now()
  };

  next();
}
