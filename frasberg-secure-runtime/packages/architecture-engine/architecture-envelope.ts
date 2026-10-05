import { Architecture } from "./architecture-model";

export function buildArchitectureEnvelope(architecture: Architecture) {
  return {
    architectureId: architecture.architectureId,
    blueprint: architecture.blueprint,
    design: architecture.design,
    architectureGraph: architecture.architectureGraph,
    timestamp: Date.now()
  };
}
