export function buildStructureEnvelope(structure) {
  return {
    structureId: structure.structureId,
    formation: structure.formation,
    dynamics: structure.dynamics,
    structureGraph: structure.structureGraph,
    timestamp: Date.now()
  };
}
