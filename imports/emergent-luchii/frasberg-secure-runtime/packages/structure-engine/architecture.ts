export function buildArchitecture(pattern: any) {
  return {
    patternArchitecture: pattern.structure,
    formationArchitecture: pattern.formation,
    timestamp: Date.now()
  };
}
