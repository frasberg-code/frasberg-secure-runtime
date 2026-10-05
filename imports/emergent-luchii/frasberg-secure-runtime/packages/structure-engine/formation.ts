export function buildFormation(pattern: any) {
  return {
    patternFormation: pattern.structure,
    dynamicsFormation: pattern.dynamics,
    timestamp: Date.now(),
  };
}
