export const gt6WorldTemplate = {
  name: 'GT6 Simulation World',
  type: 'race',
  tracks: [],
  cars: [],
  rules: {
    laps: 10,
    safetyCar: true,
    penalties: true,
  },
};

export function createRaceWorldDefinition(raceId: string) {
  return {
    ...gt6WorldTemplate,
    externalId: raceId,
  };
}
