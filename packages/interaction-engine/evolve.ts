export function evolveInteraction(interaction: any) {
  return {
    interactionId: interaction.interactionId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
