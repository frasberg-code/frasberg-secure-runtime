import { BroadcastFrame } from './broadcastMode';

export interface Keyframe {
  index: number;
  label: string;
}

export function buildKeyframes(frames: BroadcastFrame[]): Keyframe[] {
  const keys: Keyframe[] = [];
  frames.forEach((f, index) => {
    const t = f.shot?.type;
    if (t === 'finish_line') keys.push({ index, label: 'Finish Line' });
    if (t === 'car_follow' && f.shot?.meta?.overtake) keys.push({ index, label: 'Overtake' });
    if (t === 'track_pan' && f.shot?.meta?.crash) keys.push({ index, label: 'Incident' });
  });
  return keys;
}

export function jumpToKeyframe(frames: BroadcastFrame[], key: Keyframe) {
  return frames[key.index];
}