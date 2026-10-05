import { BroadcastFrame } from '../gt6/broadcastMode';
import { FrasbergTtsProvider } from './tts/FrasbergTtsProvider';

export interface CommentaryChunk {
  id: string;
  timestamp: number;
  text: string;
  audioUrl?: string;
  audioError?: string;
}

// A failed synthesis leaves audioUrl unset and records the error; it never aborts the broadcast.
export async function generateRealTimeCommentary(
  frames: BroadcastFrame[],
  tts: FrasbergTtsProvider,
): Promise<CommentaryChunk[]> {
  const chunks: CommentaryChunk[] = [];
  for (const [i, f] of frames.entries()) {
    const chunk: CommentaryChunk = { id: `rtc-${i}`, timestamp: f.timestamp, text: f.commentary };
    try {
      chunk.audioUrl = await tts.synthesize(f.commentary);
    } catch (error) {
      chunk.audioError = (error as Error).message;
    }
    chunks.push(chunk);
  }
  return chunks;
}