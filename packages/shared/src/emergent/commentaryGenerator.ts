import { RaceState } from '../gt6/simulation-state';
import { CinematicShot } from '../gt6/cinematicRenderer';

export function generateCommentary(state: RaceState, shot: CinematicShot): string {
  switch (shot.type) {
    case 'grid_intro':
      return `Cars are lined up on the grid. ${state.cars.length} drivers ready for the start.`;
    case 'car_follow': {
      const car = state.cars.find((c) => c.id === shot.focusCarId);
      if (!car) return 'Camera following a car.';
      return `Following ${car.name}, currently at position ${car.position}, pushing at ${Math.round(car.speedKph)} kph.`;
    }
    case 'track_pan':
      return `Wide track pan over ${state.track.name}, conditions ${state.track.weather}, grip ${state.track.surfaceGrip}.`;
    case 'finish_line': {
      const winner = state.cars.find((c) => c.id === shot.meta?.winnerId);
      return winner
        ? `${winner.name} crosses the finish line first!`
        : 'Finish line shot.';
    }
    default:
      return 'Broadcast continues.';
  }
}