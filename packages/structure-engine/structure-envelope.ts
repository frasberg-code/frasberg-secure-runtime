import { Structure } from './structure-model';

export function buildStructureEnvelope(structure: Structure) {
  const envelope = {
    structureId: structure.structureId,
    structureGraph: structure.structureGraph,
    timestamp: Date.now(),
  };

  if (structure.formation !== undefined || structure.dynamics !== undefined) {
    return {
      ...envelope,
      formation: structure.formation,
      dynamics: structure.dynamics,
    };
  }

  return {
    ...envelope,
    architecture: structure.architecture,
    fabric: structure.fabric,
  };
}
