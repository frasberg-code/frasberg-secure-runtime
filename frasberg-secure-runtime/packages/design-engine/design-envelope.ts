import { Design } from "./design-model";

export function buildDesignEnvelope(design: Design) {
  return {
    designId: design.designId,
    logic: design.logic,
    behavior: design.behavior,
    designGraph: design.designGraph,
    timestamp: Date.now()
  };
}
