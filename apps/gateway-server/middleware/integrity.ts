import crypto from "crypto";
import { buildValidation } from "../../../packages/integrity-engine/validation";
import { buildHealth } from "../../../packages/integrity-engine/health";
import { buildIntegrityGraph } from "../../../packages/integrity-engine/integrity-graph";

export function injectIntegrity(req: any, res: any, next: any) {
  const enforcement = req.enforcement;

  const validation = buildValidation(enforcement);
  const health = buildHealth(validation);
  const graph = buildIntegrityGraph(health);

  req.integrity = {
    integrityId: crypto.randomUUID(),
    validation,
    health,
    integrityGraph: graph,
    createdAt: Date.now()
  };

  next();
}
