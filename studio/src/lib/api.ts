import { getToken } from './session';

function headers(json = true): Record<string, string> {
  const token = getToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { ...init, headers: { ...headers(), ...(init.headers as object) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const race = (id: string) => `/api/gt6/${encodeURIComponent(id)}`;

export const getAssets = () => request<{ nodes: Record<string, any>; edges: any[] }>('/api/creator/assets');
export const publishAsset = (data: unknown) =>
  request('/api/publish', { method: 'POST', body: JSON.stringify(data) });
export const getBroadcast = (raceId: string) => request<{ frames: any[] }>(`${race(raceId)}/broadcast`);
export const getMixed = (raceId: string) =>
  request<{ frames: any[]; cameraPlan: any[]; audioTrack: any[] }>(`${race(raceId)}/mixed`);
export const getKeyframes = (raceId: string) =>
  request<{ keyframes: { index: number; label: string }[] }>(`${race(raceId)}/keyframes`);
export const exportMp4 = (raceId: string) =>
  request<{ jobId: string; status: string }>(`${race(raceId)}/export/mp4`, { method: 'POST' });
export const exportStatus = (jobId: string) =>
  request<{ status: string; mp4Url?: string; error?: string; renderMode?: string }>(`/api/exports/${encodeURIComponent(jobId)}/status`);
export const getRaceStory = (raceId: string) => request<{ beats: string[] }>(`${race(raceId)}/story`);
export const saveRaceStory = (raceId: string, beats: string[]) =>
  request(`${race(raceId)}/story`, { method: 'PUT', body: JSON.stringify({ beats }) });
export interface StudioRelease {
  tagName: string;
  name: string;
  createdAt: string;
  notes: string;
  url: string;
  draft: boolean;
  prerelease: boolean;
}
export const getReleases = () => request<StudioRelease[]>('/api/releases');
export const createRelease = (data: { version: string; name: string; notes: string }) =>
  request<StudioRelease>('/api/releases/new', { method: 'POST', body: JSON.stringify(data) });
export const getCinematicPlan = (raceId: string) =>
  request<{ mode: string; summary: string; shots: unknown[]; cameraPlan: unknown[] }>(
    `/api/ai/cinematic/${encodeURIComponent(raceId)}`,
    { method: 'POST' },
  );
export const runBroadcastAutomation = (raceId: string) =>
  request<{
    mode: string;
    cameraPlan: unknown[];
    commentary: unknown[];
    exportJobId: string;
    note: string;
  }>(`/api/gt6/${encodeURIComponent(raceId)}/automation`, { method: 'POST' });
export const getRaceAnalytics = (raceId: string) =>
  request<{
    raceId: string;
    topSpeedCarId?: string;
    topSpeedKph?: number;
    averageSpeedByCar: Record<string, number>;
  }>(`/api/gt6/${encodeURIComponent(raceId)}/analytics`);
export const setLiveCamera = (raceId: string, camera: string) =>
  request(`/api/gt6/${encodeURIComponent(raceId)}/camera`, { method: 'POST', body: JSON.stringify({ camera }) });
