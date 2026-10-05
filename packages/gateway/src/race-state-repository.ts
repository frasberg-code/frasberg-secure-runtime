import { randomUUID } from 'node:crypto';
import type { RaceState } from '@frasberg/shared';
import type { ReplayFrame } from '@frasberg/shared';
import type { RuntimeStateStore } from './runtime-state-store';

const MAX_REPLAY_FRAMES = 2000;

export class RaceStateRepository {
  constructor(private readonly store: RuntimeStateStore) {}

  async save(state: RaceState): Promise<void> {
    const pk = this.partition(state.raceId);
    await this.store.put({
      pk,
      sk: 'STATE',
      kind: 'race-state',
      value: state,
    });
    await this.store.put({
      pk,
      sk: `FRAME#${String(state.timestampMs).padStart(16, '0')}#${randomUUID()}`,
      kind: 'replay-frame',
      value: { timestamp: state.timestampMs, cars: state.cars } satisfies ReplayFrame,
    });
    const oldFrames = await this.store.query(pk, {
      skPrefix: 'FRAME#',
      descending: true,
      limit: MAX_REPLAY_FRAMES + 200,
    });
    for (const frame of oldFrames.slice(MAX_REPLAY_FRAMES)) {
      await this.store.delete(frame.pk, frame.sk);
    }
  }

  async load(raceId: string): Promise<RaceState | undefined> {
    const record = await this.store.get(this.partition(raceId), 'STATE');
    return record?.value as RaceState | undefined;
  }

  async replayFrames(raceId: string): Promise<ReplayFrame[]> {
    const frames = await this.store.query(this.partition(raceId), {
      skPrefix: 'FRAME#',
      descending: true,
      limit: MAX_REPLAY_FRAMES,
    });
    return frames
      .map((frame) => frame.value as ReplayFrame)
      .reverse();
  }

  private partition(raceId: string) {
    return `RACE#${raceId}`;
  }
}
