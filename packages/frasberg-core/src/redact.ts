const REDACT_KEYS = new Set([
  'authorization',
  'x-api-key',
  'api-key',
  'apikey',
  'api_key',
  'cookie',
  'set-cookie',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'password',
]);

export function redactObject(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactObject);

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACT_KEYS.has(key.toLowerCase())
      ? '[REDACTED]'
      : redactObject(val);
  }
  return result;
}
