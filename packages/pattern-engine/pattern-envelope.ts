import { Pattern } from './pattern-model';

export function buildPatternEnvelope(pattern: Pattern) {
  const envelope = {
    patternId: pattern.patternId,
    structure: pattern.structure,
    patternGraph: pattern.patternGraph,
    timestamp: Date.now(),
  };

  if (pattern.dynamics !== undefined) {
    return { ...envelope, dynamics: pattern.dynamics };
  }

  return { ...envelope, formation: pattern.formation };
}
