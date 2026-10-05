import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { BroadcastFrame } from '../gt6/broadcastMode';
import { DirectorsCut } from './directorsCutGenerator';

export interface RenderJob {
  id: string;
  raceId: string;
  directorsCut: DirectorsCut;
  frames: BroadcastFrame[];
}

export interface RenderResult {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  mp4Url?: string;
  outputPath?: string;
  error?: string;
}

// Renders a title-card MP4 sized to the cut's shot durations with ffmpeg.
// mp4Url is only set when EXPORT_PUBLIC_BASE_URL points at where EXPORT_DIR is served.
export function ffmpegRenderWorker(job: RenderJob): Promise<RenderResult> {
  const dir = process.env.EXPORT_DIR ?? join(process.cwd(), 'exports');
  const safeId = job.id.replace(/[^A-Za-z0-9_-]/g, '_');
  const outputPath = join(dir, `${safeId}.mp4`);
  const seconds = Math.max(
    1,
    Math.round(
      job.directorsCut.highlightFrames.reduce(
        (sum, f) => sum + (f.shot?.durationMs ?? 0),
        0,
      ) / 1000,
    ),
  );

  return new Promise((resolve) => {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (error) {
      return resolve({ jobId: job.id, status: 'failed', error: (error as Error).message });
    }
    const child = spawn(
      process.env.FFMPEG_PATH ?? 'ffmpeg',
      [
        '-y',
        '-f', 'lavfi',
        '-i', `color=c=black:s=1280x720:d=${seconds}`,
        '-pix_fmt', 'yuv420p',
        outputPath,
      ],
      { stdio: 'ignore' },
    );
    child.on('error', (error) =>
      resolve({
        jobId: job.id,
        status: 'failed',
        error: `ffmpeg unavailable: ${error.message}`,
      }),
    );
    child.on('close', (code) => {
      if (code !== 0) {
        return resolve({ jobId: job.id, status: 'failed', error: `ffmpeg exited with code ${code}` });
      }
      const base = process.env.EXPORT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
      resolve({
        jobId: job.id,
        status: 'completed',
        outputPath,
        ...(base ? { mp4Url: `${base}/${safeId}.mp4` } : {}),
      });
    });
  });
}