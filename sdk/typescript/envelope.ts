export interface ApiEnvelope<TPayload = unknown> {
  version: 'v1';
  owner: string;
  continuity: unknown;
  diagnostics: unknown;
  policy: unknown;
  payload: TPayload;
  timestamp: number;
}

export function parseEnvelope<TPayload = unknown>(
  value: unknown,
): ApiEnvelope<TPayload> {
  if (
    !isRecord(value) ||
    value.version !== 'v1' ||
    typeof value.owner !== 'string' ||
    !('continuity' in value) ||
    !('diagnostics' in value) ||
    !('policy' in value) ||
    !('payload' in value) ||
    typeof value.timestamp !== 'number' ||
    !Number.isFinite(value.timestamp)
  ) {
    throw new Error('Invalid Frasberg API envelope.');
  }

  return {
    version: 'v1',
    owner: value.owner,
    continuity: value.continuity,
    diagnostics: value.diagnostics,
    policy: value.policy,
    payload: value.payload as TPayload,
    timestamp: value.timestamp,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
