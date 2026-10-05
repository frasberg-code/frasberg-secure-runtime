import { BroadcastFrame } from '../gt6/broadcastMode';
import { CameraPlan } from '../gt6/multiCameraDirector';
import { CommentaryChunk } from './realTimeCommentary';

export interface MixedBroadcast {
  id: string;
  frames: BroadcastFrame[];
  cameraPlan: CameraPlan[];
  audioTrack: CommentaryChunk[];
  videoPlan: any;
}

export function mixBroadcast(
  frames: BroadcastFrame[],
  cameraPlan: CameraPlan[],
  audioTrack: CommentaryChunk[],
  videoPlan: any,
): MixedBroadcast {
  return { id: `mix-${Date.now()}`, frames, cameraPlan, audioTrack, videoPlan };
}