import { Structure } from "./structure-model";

export function buildStructureEnvelope(structure: Structure) {
  return {
    structureId: structure.structureId,
    architecture: structure.architecture,
    fabric: structure.fabric,
    structureGraph: structure.structureGraph,
    timestamp: Date.now()
  };
}
