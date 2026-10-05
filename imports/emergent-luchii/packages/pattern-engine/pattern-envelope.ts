export function buildPatternEnvelope(pattern) {
  return {
    patternId: pattern.patternId,
    structure: pattern.structure,
    dynamics: pattern.dynamics,
    patternGraph: pattern.patternGraph,
    timestamp: Date.now()
  };
}
