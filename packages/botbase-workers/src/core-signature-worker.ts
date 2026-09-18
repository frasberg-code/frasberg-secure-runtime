import { createHmac } from 'node:crypto';
import { json, signingSecretOrFailClosed } from './lib';
import type { WorkerEnv } from './types';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method !== 'POST') {
      return json({ error: 'Only POST is supported.' }, 405);
    }

    try {
      const secret = signingSecretOrFailClosed(env);
      const payload = await request.text();
      const signature = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      return json({ signature, algorithm: 'hmac-sha256' });
    } catch (error) {
      return json({ error: (error as Error).message }, 503);
    }
  },
};
