import { BroadcastFrame } from './broadcastMode';

export interface RaceStory {
  id: string;
  title: string;
  beats: string[];
  highlights: { index: number; label: string }[];
}

export function generateRaceStory(frames: BroadcastFrame[]): RaceStory {
  const beats: string[] = [];
  const highlights: { index: number; label: string }[] = [];
  frames.forEach((f, i) => {
    const t = f.shot?.type;
    if (t === 'grid_intro') beats.push('The drivers line up on the grid, engines rumbling.');
    if (t === 'car_follow' && f.shot?.meta?.overtake) {
      beats.push(`A dramatic overtake occurs at frame ${i}.`);
      highlights.push({ index: i, label: 'Overtake' });
    }
    if (t === 'track_pan' && f.shot?.meta?.crash) {
      beats.push(`A crash disrupts the race at frame ${i}.`);
      highlights.push({ index: i, label: 'Crash' });
    }
    if (t === 'finish_line') {
      beats.push('The race concludes with a decisive finish.');
      highlights.push({ index: i, label: 'Finish Line' });
    }
  });
  return { id: `story-${Date.now()}`, title: 'GT6 Race Story', beats, highlights };
}