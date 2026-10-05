import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import {
  buildBroadcastFrames,
  generateDirectorsCut,
  type RaceState,
} from '@frasberg/shared';
import { ffmpegRenderWorker } from '@frasberg/shared';
import { RuntimeAssetStore } from './runtime-asset-store';
import type { RuntimeStateStore } from './runtime-state-store';

interface ExportJob {
  jobId: string;
  raceId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string;
  renderMode?: 'color-placeholder';
  error?: string;
  s3Key?: string;
}

const ownerPartition = (ownerId: string) => `OWNER#${ownerId}`;
const jobSortKey = (jobId: string) => `EXPORT#${jobId}`;

export async function enqueueExport(
  store: RuntimeStateStore,
  assets: RuntimeAssetStore,
  ownerId: string,
  raceId: string,
  state: RaceState,
): Promise<string> {
  const jobId = `broadcast-video-${randomUUID()}`;
  const job: ExportJob = {
    jobId,
    raceId,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
  await store.put({
    pk: ownerPartition(ownerId),
    sk: jobSortKey(jobId),
    kind: 'export-job',
    value: job,
  });
  void runExport(store, assets, ownerId, job, state).catch((error) => {
    console.error('Unexpected export worker failure', {
      jobId,
      error: (error as Error).message,
    });
  });
  return jobId;
}

export async function getExportStatus(
  store: RuntimeStateStore,
  assets: RuntimeAssetStore,
  ownerId: string,
  jobId: string,
): Promise<(ExportJob & { mp4Url?: string }) | undefined> {
  const record = await store.get(ownerPartition(ownerId), jobSortKey(jobId));
  if (!record || record.kind !== 'export-job') return undefined;
  const job = record.value as ExportJob;
  return {
    ...job,
    ...(job.s3Key ? { mp4Url: await assets.createDownloadUrl(job.s3Key) } : {}),
  };
}

async function runExport(
  store: RuntimeStateStore,
  assets: RuntimeAssetStore,
  ownerId: string,
  job: ExportJob,
  state: RaceState,
) {
  const pk = ownerPartition(ownerId);
  const sk = jobSortKey(job.jobId);
  let outputPath: string | undefined;
  try {
    const running: ExportJob = { ...job, status: 'running' };
    await store.put({ pk, sk, kind: 'export-job', value: running });
    const frames = buildBroadcastFrames(state);
    const result = await ffmpegRenderWorker({
      id: job.jobId,
      raceId: job.raceId,
      directorsCut: generateDirectorsCut(frames),
      frames,
    });
    outputPath = result.outputPath;
    if (result.status !== 'completed' || !outputPath) {
      throw new Error(result.error ?? 'Render completed without an output file');
    }
    const s3Key = `exports/${encodeURIComponent(ownerId)}/${job.jobId}.mp4`;
    await assets.uploadFile(s3Key, outputPath);
    await store.put({
      pk,
      sk,
      kind: 'export-job',
      value: { ...running, status: 'completed', renderMode: result.renderMode, s3Key },
    });
  } catch (error) {
    await store.put({
      pk,
      sk,
      kind: 'export-job',
      value: {
        ...job,
        status: 'failed',
        error: (error as Error).message,
      },
    });
  } finally {
    if (outputPath) await rm(outputPath, { force: true });
  }
}
