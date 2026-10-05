import { describe, expect, it } from 'vitest';
import { createInitialRaceState, type CarState, type TrackState } from '@frasberg/shared';
import { RaceStateRepository } from '../src/race-state-repository';
import { DynamoRuntimeStateStore } from '../src/runtime-state-store';

const track: TrackState = {
  id: 'track-1',
  name: 'Test Track',
  lengthKm: 5,
  weather: 'clear',
  trackTempC: 24,
  surfaceGrip: 1,
};
const cars: CarState[] = [{
  id: 'car-1',
  name: 'Car 1',
  team: 'team',
  position: 1,
  lap: 1,
  sector: 1,
  speedKph: 180,
  gear: 5,
  rpm: 7000,
  tireCompound: 'soft',
  tireTempC: 90,
  fuelLiters: 40,
  damageLevel: 0,
}];

describe('runtime persistence adapters', () => {
  it('stores race state and ordered replay frames in the shared table abstraction', async () => {
    const store = new DynamoRuntimeStateStore('');
    const races = new RaceStateRepository(store);
    const state = createInitialRaceState('race-persisted', track, cars, 5);

    await races.save(state);

    expect(await races.load(state.raceId)).toEqual(state);
    expect(await races.replayFrames(state.raceId)).toEqual([
      { timestamp: state.timestampMs, cars: state.cars },
    ]);
  });

  it('isolates records by partition and sort key', async () => {
    const store = new DynamoRuntimeStateStore('');
    await store.put({ pk: 'OWNER#a', sk: 'STORY#race', kind: 'race-story', value: { beats: [] } });
    await store.put({ pk: 'OWNER#b', sk: 'STORY#race', kind: 'race-story', value: { beats: ['private'] } });

    expect((await store.query('OWNER#a', { skPrefix: 'STORY#' })).map((r) => r.value))
      .toEqual([{ beats: [] }]);
  });
});
