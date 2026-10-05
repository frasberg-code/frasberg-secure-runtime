import { callService } from '../router';

export type LinqRequest = {
  query: string;
  userId: string;
  context?: Record<string, unknown>;
};

export type ComputeResult = {
  output: unknown;
  latencyMs: number;
};

export async function executeLinqPipeline(
  req: LinqRequest,
): Promise<ComputeResult> {
  const coreResponse = await callService('core', '/pipeline/prepare', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });

  const corePayload = await coreResponse.json();

  const computeResponse = await callService('compute', '/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corePayload),
  });

  const computePayload = await computeResponse.json();

  return {
    output: computePayload.result ?? computePayload,
    latencyMs:
      typeof computePayload.latencyMs === 'number'
        ? computePayload.latencyMs
        : 0,
  };
}
