import { Scene } from './sceneComposer';

export interface FusedMultimodal {
  narrative: string;
  videoPlan?: any;
  musicPlan?: any;
  voicePlan?: any;
  imagePlan?: any;
}

export function fuseMultimodal(scenes: Scene[]): FusedMultimodal {
  const fused: FusedMultimodal = {
    narrative: 'Cinematic GT6 race experience composed by Frasberg.',
  };

  for (const scene of scenes) {
    if (scene.type === 'video') fused.videoPlan = scene.payload;
    if (scene.type === 'music') fused.musicPlan = scene.payload;
    if (scene.type === 'voice') fused.voicePlan = scene.payload;
    if (scene.type === 'image') fused.imagePlan = scene.payload;
  }

  return fused;
}
