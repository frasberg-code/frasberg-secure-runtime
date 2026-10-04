export function buildFlow(interaction: any) {
  return {
    interactionFlow: interaction.exchange,
    patternFlow: interaction.pattern,
    timestamp: Date.now()
  };
}
