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
  request<{ status: string; mp4Url?: string; error?: string }>(`/api/exports/${encodeURIComponent(jobId)}/status`);
export const getRaceStory = (raceId: string) => request<{ beats: string[] }>(`${race(raceId)}/story`);
export const saveRaceStory = (raceId: string, beats: string[]) =>
  request(`${race(raceId)}/story`, { method: 'PUT', body: JSON.stringify({ beats }) });
export const setLiveCamera = (raceId: string, camera: string) =>
  request(`/api/gt6/${encodeURIComponent(raceId)}/camera`, { method: 'POST', body: JSON.stringify({ camera }) });
