export function buildStructureGraph(fabric: any) {
  if (fabric.structuralStructuralDynamics !== undefined) {
    return {
      nodes: [
        {
          id: 'formation',
          weight: fabric.structuralStructuralDynamics === 'structured' ? 1 : 0,
        },
        {
          id: 'dynamics',
          weight: fabric.harmonyStructuralDynamics === 'coherent' ? 1 : 0,
        },
      ],
      edges: [{ from: 'formation', to: 'dynamics', relation: 'stabilizes' }],
    };
  }

  return {
    nodes: [
      {
        id: 'architecture',
        weight: fabric.structuralFabric === 'woven' ? 1 : 0,
      },
      { id: 'fabric', weight: fabric.harmonyFabric === 'stable' ? 1 : 0 },
    ],
    edges: [{ from: 'architecture', to: 'fabric', relation: 'supports' }],
  };
}
