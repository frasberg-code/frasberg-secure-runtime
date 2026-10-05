import { buildBroadcastFrames } from '../gt6/broadcastMode';
import { generateDirectorsCut } from './directorsCutGenerator';
import { ffmpegRenderWorker, RenderResult } from './ffmpegRender';
import { loadRaceState } from './raceStateStore';

const MAX_RESULTS = 200;
const RESULTS = new Map<string, RenderResult | { status: string; error?: string }>();
let counter = 0;

export function enqueueBroadcastToVideo(raceId: string): string {
  const id = `broadcast-video-${Date.now()}-${++counter}`;
  RESULTS.set(id, { status: 'queued' });
  while (RESULTS.size > MAX_RESULTS) {
    RESULTS.delete(RESULTS.keys().next().value as string);
  }
  void run(id, raceId);
  return id;
}

async function run(id: string, raceId: string) {
  const state = loadRaceState(raceId);
  if (!state) {
    RESULTS.set(id, { status: 'failed', error: 'race not found' });
    return;
  }
  RESULTS.set(id, { status: 'running' });
  const frames = buildBroadcastFrames(state);
  const directorsCut = generateDirectorsCut(frames);
  RESULTS.set(id, await ffmpegRenderWorker({ id, raceId, directorsCut, frames }));
}

export function getBroadcastToVideoStatus(jobId: string) {
  return RESULTS.get(jobId) ?? { status: 'not_found' };
}