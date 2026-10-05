export function buildFormation(pattern) {
  return {
    patternFormation: pattern.structure,
    dynamicsFormation: pattern.dynamics,
    timestamp: Date.now()
  };
}
