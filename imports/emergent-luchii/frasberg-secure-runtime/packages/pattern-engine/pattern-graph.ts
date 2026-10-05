export function buildPatternGraph(formation: any) {
  if (formation.structuralPatternDynamics !== undefined) {
    return {
      nodes: [
        {
          id: 'structure',
          weight: formation.structuralPatternDynamics === 'patterned' ? 1 : 0,
        },
        {
          id: 'dynamics',
          weight: formation.harmonyPatternDynamics === 'stable' ? 1 : 0,
        },
      ],
      edges: [{ from: 'structure', to: 'dynamics', relation: 'shapes' }],
    };
  }

  return {
    nodes: [
      {
        id: 'structure',
        weight: formation.structuralFormation === 'formed' ? 1 : 0,
      },
      {
        id: 'formation',
        weight: formation.harmonyFormation === 'coherent' ? 1 : 0,
      },
    ],
    edges: [{ from: 'structure', to: 'formation', relation: 'creates' }],
  };
}
