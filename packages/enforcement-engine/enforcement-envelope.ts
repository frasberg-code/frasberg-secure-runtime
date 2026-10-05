import { Enforcement } from "./enforcement-model";

export function buildEnforcementEnvelope(enforcement: Enforcement) {
  return {
    enforcementId: enforcement.enforcementId,
    appliedRules: enforcement.appliedRules,
    propagation: enforcement.propagation,
    enforcementGraph: enforcement.enforcementGraph,
    timestamp: Date.now()
  };
}
