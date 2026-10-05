import { useFrasbergClient } from "../hooks/useFrasbergClient";

export async function startJob(type, payload) {
  const client = useFrasbergClient();
  return client.request(`/v1/jobs/start`, { type, payload });
}

export async function pollJob(jobId) {
  const client = useFrasbergClient();
  return client.request(`/v1/jobs/status`, { jobId });
}

export async function fetchJobResult(jobId) {
  const client = useFrasbergClient();
  return client.request(`/v1/jobs/result`, { jobId });
}

export async function generateMusic(prompt) {
  const client = useFrasbergClient();
  return client.request("/v1/music", { prompt });
}

export async function generateVideo(prompt) {
  const client = useFrasbergClient();
  return client.request("/v1/video", { prompt });
}

export async function generateImage(prompt) {
  const client = useFrasbergClient();
  return client.request("/v1/image", { prompt });
}

export async function processAudio(operation, payload) {
  const client = useFrasbergClient();
  return client.request(`/v1/audio/${operation}`, payload);
}

export async function generateVoice(text) {
  const client = useFrasbergClient();
  return client.request("/v1/voice", { text });
}

export async function transcribeAudio(file) {
  const client = useFrasbergClient();
  return client.request("/v1/stt", { file });
}

export async function synthesizeSpeech(text) {
  const client = useFrasbergClient();
  return client.request("/v1/tts", { text });
}

export async function publish(jobId) {
  const client = useFrasbergClient();
  return client.request("/v1/publish", { jobId });
}
