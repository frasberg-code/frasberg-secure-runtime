import { BroadcastFrame } from '../gt6/broadcastMode';
import { ffmpegRenderWorker, RenderResult } from './ffmpegRender';
import { MixedBroadcast } from './broadcastMixer';

export interface RenderJobV2 {
  id: string;
  raceId: string;
  mix: MixedBroadcast;
}

export type RenderResultV2 = RenderResult;

// Renders the mixed broadcast's full timeline length through ffmpeg. Video is a placeholder
// title-card canvas and audio is NOT muxed yet; no GPU path. Completed jobs carry outputPath.
export function cinematicRenderWorkerV2(job: RenderJobV2): Promise<RenderResultV2> {
  const frames: BroadcastFrame[] = job.mix.frames;
  return ffmpegRenderWorker({
    id: job.id,
    raceId: job.raceId,
    frames,
    directorsCut: {
      id: job.mix.id,
      title: 'Frasberg GT6 Broadcast',
      highlightFrames: frames,
      narrative: `Mixed broadcast of ${frames.length} frames`,
    },
  });
}