export function evolveBedrock(bedrock: any) {
  return {
    bedrockId: bedrock.bedrockId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
