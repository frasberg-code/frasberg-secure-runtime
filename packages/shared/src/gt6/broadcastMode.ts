import { RaceState } from './simulation-state';
import { buildCinematicSequence } from './cinematicRenderer';
import { generateCommentary } from '../emergent/commentaryGenerator';
import { composeScenes } from '../emergent/sceneComposer';
import { fuseMultimodal } from '../emergent/multimodalFusionEngine';

export interface BroadcastFrame {
  timestamp: number;
  shot: any;
  commentary: string;
  fusion: any;
}

export function buildBroadcastFrames(state: RaceState): BroadcastFrame[] {
  const shots = buildCinematicSequence(state);
  const fusion = fuseMultimodal(composeScenes(state));
  const start = Date.now();
  let offset = 0;

  return shots.map((shot) => {
    const frame: BroadcastFrame = {
      timestamp: start + offset,
      shot,
      commentary: generateCommentary(state, shot),
      fusion,
    };
    offset += shot.durationMs;
    return frame;
  });
}