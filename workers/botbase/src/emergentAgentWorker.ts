import {
  EmergentAgentLoop,
  EmergentAgentRuntime,
  WorldgraphClient,
} from '../../../packages/shared/src/emergent';

export async function emergentAgentWorker(job: { payload: any }) {
  const baseUrl = process.env.FRASBERG_BASE_URL ?? 'https://frasberg.com';
  const apiKey = process.env.FRASBERG_GATEWAY_API_KEY ?? '';
  const loop = new EmergentAgentLoop(
    new EmergentAgentRuntime(baseUrl, apiKey),
    new WorldgraphClient(baseUrl, apiKey),
  );
  return loop.execute(job.payload);
}