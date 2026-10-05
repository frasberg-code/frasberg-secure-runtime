import { describe, expect, it } from 'vitest';
import {
  analyzeRaceTelemetry, buildCameraPlan, buildKeyframes, generateRaceStory,
  generateRealTimeCommentary, DefaultTtsProvider, mixBroadcast, setCamera,
} from '../src';

const frames: any[] = [
  { timestamp: 1, shot: { id: 'a', type: 'grid_intro' }, commentary: 'x', fusion: {} },
  { timestamp: 2, shot: { id: 'b', type: 'finish_line' }, commentary: 'y', fusion: {} },
];

describe('broadcast extras', () => {
  it('plans cameras, keyframes and story', () => {
    const plan = buildCameraPlan(frames);
    expect(plan[0].camera).toBe('drone');
    expect(setCamera(plan, 'b', 'cockpit')[1].camera).toBe('cockpit');
    expect(buildKeyframes(frames)).toEqual([{ index: 1, label: 'Finish Line' }]);
    expect(generateRaceStory(frames).beats).toHaveLength(2);
  });
  it('default TTS failure is recorded, not faked', async () => {
    const chunks = await generateRealTimeCommentary(frames, new DefaultTtsProvider());
    expect(chunks[0].audioUrl).toBeUndefined();
    expect(chunks[0].audioError).toMatch(/No TTS provider/);
    expect(mixBroadcast(frames, [], chunks, null).frames).toHaveLength(2);
  });
  it('analyzes telemetry', () => {
    const r = analyzeRaceTelemetry('r', [
      { timestamp: 1, carId: 'a', speedKph: 100, lap: 1, position: 1 },
      { timestamp: 2, carId: 'a', speedKph: 200, lap: 1, position: 1 },
      { timestamp: 1, carId: 'b', speedKph: 150, lap: 1, position: 2 },
    ]);
    expect(r.topSpeedCarId).toBe('a');
    expect(r.averageSpeedByCar.a).toBe(150);
  });
});