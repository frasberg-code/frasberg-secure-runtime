import { LawEngine } from "./law-model";

export function buildLawEnvelope(law: LawEngine) {
  return {
    lawId: law.lawId,
    constraints: law.constraints,
    enforcement: law.enforcement,
    lawGraph: law.lawGraph,
    timestamp: Date.now()
  };
}
