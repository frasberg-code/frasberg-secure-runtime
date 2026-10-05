import { BroadcastFrame } from '../gt6/broadcastMode';

export interface ExportBundle {
  id: string;
  video: any;
  music: any;
  voice: any;
  image: any;
  commentary: string[];
  broadcastFrames: BroadcastFrame[];
}

export function buildExportBundle(frames: BroadcastFrame[]): ExportBundle {
  const fusion = frames[0]?.fusion ?? {};
  return {
    id: `export-${Date.now()}`,
    video: fusion.videoPlan,
    music: fusion.musicPlan,
    voice: fusion.voicePlan,
    image: fusion.imagePlan,
    commentary: frames.map((f) => f.commentary),
    broadcastFrames: frames,
  };
}