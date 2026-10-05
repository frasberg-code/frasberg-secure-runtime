import { RaceState } from './simulation-state';

export interface CinematicShot {
  id: string;
  type: 'grid_intro' | 'car_follow' | 'track_pan' | 'finish_line';
  durationMs: number;
  focusCarId?: string;
  meta?: any;
}

export function buildCinematicSequence(state: RaceState): CinematicShot[] {
  const shots: CinematicShot[] = [];

  shots.push({
    id: 'grid-intro',
    type: 'grid_intro',
    durationMs: 5000,
    meta: { cars: state.cars.map((c) => c.id) },
  });

  const leaders = [...state.cars]
    .sort((a, b) => a.position - b.position)
    .slice(0, 3);
  for (const car of leaders) {
    shots.push({
      id: `follow-${car.id}`,
      type: 'car_follow',
      focusCarId: car.id,
      durationMs: 4000,
      meta: { speedKph: car.speedKph },
    });
  }

  shots.push({
    id: 'track-pan',
    type: 'track_pan',
    durationMs: 6000,
    meta: { trackId: state.track.id },
  });

  shots.push({
    id: 'finish-line',
    type: 'finish_line',
    durationMs: 5000,
    meta: { winnerId: leaders[0]?.id },
  });

  return shots;
}
