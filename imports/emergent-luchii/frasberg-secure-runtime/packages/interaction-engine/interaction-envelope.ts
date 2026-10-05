import { Interaction } from "./interaction-model";

export function buildInteractionEnvelope(interaction: Interaction) {
  return {
    interactionId: interaction.interactionId,
    exchange: interaction.exchange,
    pattern: interaction.pattern,
    interactionGraph: interaction.interactionGraph,
    timestamp: Date.now()
  };
}
