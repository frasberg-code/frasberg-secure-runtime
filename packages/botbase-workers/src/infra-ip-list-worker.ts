import { authenticateWorkerRequest, json } from './lib';
import type { WorkerEnv } from './types';

const staticCidrs = ['127.0.0.1/32', '10.0.0.0/8', '192.168.0.0/16'];

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const auth = await authenticateWorkerRequest(request, env);
    if (!auth.ok) {
      return auth.response;
    }

    return json({
      tenantId: auth.tenantId,
      addresses: staticCidrs,
      source: 'local scaffold placeholder',
    });
  },
};
