import { BroadcastFrame } from '../gt6/broadcastMode';

export interface DirectorsCut {
  id: string;
  title: string;
  highlightFrames: BroadcastFrame[];
  narrative: string;
}

export function generateDirectorsCut(frames: BroadcastFrame[]): DirectorsCut {
  const highlights = frames.filter((f) => {
    const t = f.shot?.type;
    return t === 'grid_intro' || t === 'car_follow' || t === 'finish_line';
  });

  return {
    id: `directors-cut-${Date.now()}`,
    title: "Frasberg GT6 Director's Cut",
    highlightFrames: highlights,
    narrative: `Director's cut with ${highlights.length} key moments selected from ${frames.length} broadcast frames.`,
  };
}