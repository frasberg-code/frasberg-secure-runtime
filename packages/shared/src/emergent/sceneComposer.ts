import { RaceState } from '../gt6/simulation-state';

export interface Scene {
  id: string;
  type: 'video' | 'music' | 'voice' | 'image';
  payload: any;
}

export function composeScenes(raceState: RaceState): Scene[] {
  return [
    { id: 'race-video', type: 'video', payload: { raceState } },
    {
      id: 'race-music',
      type: 'music',
      payload: { intensity: 'high', laps: raceState.lapCount },
    },
    {
      id: 'race-voice',
      type: 'voice',
      payload: {
        script: `Race ${raceState.raceId} underway with ${raceState.cars.length} cars.`,
      },
    },
    {
      id: 'race-image',
      type: 'image',
      payload: { trackId: raceState.track.id, layout: 'top-down' },
    },
  ];
}
