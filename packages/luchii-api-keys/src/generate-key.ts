import { createHash, randomBytes } from 'node:crypto';

export const KEY_PREFIX = 'luc_live_';

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// The raw key is shown to the user once; only the hash is stored.
export function generateApiKey() {
  const raw = KEY_PREFIX + randomBytes(32).toString('hex');
  return { raw, hash: hashApiKey(raw), prefix: raw.slice(0, 12) };
}
