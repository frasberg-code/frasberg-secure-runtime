export function buildBlueprint(structure: any) {
  return {
    structureBlueprint: structure.architecture,
    fabricBlueprint: structure.fabric,
    timestamp: Date.now()
  };
}
