export function buildCognitiveArchitecture(reasoning: any) {
  return {
    reasoningArchitecture: reasoning.cognition,
    interpretationArchitecture: reasoning.interpretation,
    timestamp: Date.now()
  };
}
