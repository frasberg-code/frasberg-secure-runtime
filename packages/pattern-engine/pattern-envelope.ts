import { Pattern } from "./pattern-model";

export function buildPatternEnvelope(pattern: Pattern) {
  return {
    patternId: pattern.patternId,
    structure: pattern.structure,
    formation: pattern.formation,
    patternGraph: pattern.patternGraph,
    timestamp: Date.now()
  };
}
