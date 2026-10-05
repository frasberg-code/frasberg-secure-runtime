import { BroadcastFrame } from './broadcastMode';

export type CameraName = 'static_track' | 'chase_cam' | 'cockpit' | 'drone';

export interface CameraPlan {
  shotId: string;
  camera: CameraName | string;
  focusCarId?: string;
}

const DEFAULT_CAMERA: Record<string, CameraName> = {
  grid_intro: 'drone',
  car_follow: 'chase_cam',
  track_pan: 'static_track',
  finish_line: 'static_track',
};

export function buildCameraPlan(frames: BroadcastFrame[]): CameraPlan[] {
  return frames.map((f) => ({
    shotId: f.shot?.id,
    camera: DEFAULT_CAMERA[f.shot?.type] ?? 'static_track',
    focusCarId: f.shot?.focusCarId,
  }));
}

export function setCamera(plan: CameraPlan[], shotId: string, camera: string): CameraPlan[] {
  return plan.map((c) => (c.shotId === shotId ? { ...c, camera } : c));
}