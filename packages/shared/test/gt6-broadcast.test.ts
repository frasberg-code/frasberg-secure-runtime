import { describe, expect, it } from 'vitest';
import {
  buildBroadcastFrames,
  buildExportBundle,
  generateDirectorsCut,
  saveRaceState,
  loadRaceState,
  createInitialRaceState,
} from '../src';

const cars = [1, 2].map((n) => ({
  id: `c${n}`, name: `Car ${n}`, team: 't', position: n, lap: 1, sector: 1,
  speedKph: 200, gear: 5, rpm: 8000, tireCompound: 'soft' as const,
  tireTempC: 90, fuelLiters: 50, damageLevel: 0,
}));
const track = { id: 'tr', name: 'Test', lengthKm: 5, weather: 'clear' as const, trackTempC: 25, surfaceGrip: 1 };

describe('gt6 broadcast', () => {
  it('builds frames, director cut and export bundle', () => {
    const state = createInitialRaceState('r1', track, cars, 3);
    saveRaceState(state);
    expect(loadRaceState('r1')).toBe(state);
    const frames = buildBroadcastFrames(state);
    expect(frames.length).toBeGreaterThan(0);
    expect(frames.every((f) => typeof f.commentary === 'string')).toBe(true);
    expect(generateDirectorsCut(frames).highlightFrames.length).toBeGreaterThan(0);
    expect(buildExportBundle(frames).commentary).toHaveLength(frames.length);
  });
});
