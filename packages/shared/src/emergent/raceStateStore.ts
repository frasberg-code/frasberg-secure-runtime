import { RaceState } from '../gt6/simulation-state';

export interface ReplayFrame {
  timestamp: number;
  cars: RaceState['cars'];
}

const MAX_RACES = 200;
const MAX_FRAMES = 2000;
const states = new Map<string, RaceState>();
const frames = new Map<string, ReplayFrame[]>();

export function saveRaceState(state: RaceState) {
  states.delete(state.raceId);
  states.set(state.raceId, state);
  const list = frames.get(state.raceId) ?? [];
  list.push({ timestamp: state.timestampMs, cars: state.cars });
  if (list.length > MAX_FRAMES) list.splice(0, list.length - MAX_FRAMES);
  frames.set(state.raceId, list);
  while (states.size > MAX_RACES) {
    const oldest = states.keys().next().value as string;
    states.delete(oldest);
    frames.delete(oldest);
  }
}

export function loadRaceState(raceId: string): RaceState | undefined {
  return states.get(raceId);
}

export function getReplayFrames(raceId: string): ReplayFrame[] {
  return frames.get(raceId) ?? [];
}
