import { BroadcastFrame } from '../gt6/broadcastMode';

export interface VoiceOverLine {
  id: string;
  timestamp: number;
  text: string;
}

export function generateVoiceOver(frames: BroadcastFrame[]): VoiceOverLine[] {
  return frames.map((f, i) => ({
    id: `vo-${i}`,
    timestamp: f.timestamp,
    text: f.commentary,
  }));
}