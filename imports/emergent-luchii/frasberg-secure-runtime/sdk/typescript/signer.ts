import { createHmac } from 'node:crypto';

export function signRequest(key: string, body: string): string {
  if (!key) {
    throw new Error('Signing key is required.');
  }
  return createHmac('sha256', key).update(body, 'utf8').digest('hex');
}
