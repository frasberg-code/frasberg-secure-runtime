import { Integrity } from "./integrity-model";

export function buildIntegrityEnvelope(integrity: Integrity) {
  return {
    integrityId: integrity.integrityId,
    validation: integrity.validation,
    health: integrity.health,
    integrityGraph: integrity.integrityGraph,
    timestamp: Date.now()
  };
}
