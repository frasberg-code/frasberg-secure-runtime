import { authenticateWorkerRequest, json } from './lib';
import type { WorkerEnv } from './types';

const scaffoldResponses: Record<string, Record<string, unknown>> = {
  '/mesh-routing': {
    mode: 'bounded-scaffold',
    routeSelection: 'tenant-aware placeholder',
  },
  '/search': {
    mode: 'bounded-scaffold',
    queryExecution: 'read-only placeholder',
  },
  '/billing': { mode: 'bounded-scaffold', settlement: 'dry-run only' },
  '/manifest-compilation': {
    mode: 'bounded-scaffold',
    output: 'signed-manifest placeholder',
  },
  '/compliance': {
    mode: 'bounded-scaffold',
    policyCheck: 'non-authoritative example',
  },
  '/telemetry': { mode: 'bounded-scaffold', sink: 'tenant-scoped sample only' },
  '/policy-governance': {
    mode: 'bounded-scaffold',
    decision: 'deny unless required conditions are satisfied',
  },
  '/identity': {
    mode: 'bounded-scaffold',
    claims: 'validated placeholder claims only',
  },
  '/cdn': { mode: 'bounded-scaffold', action: 'cache plan only' },
  '/dns-plan-drift': { mode: 'plan-only', action: 'no mutation performed' },
  '/threat-analysis': {
    mode: 'bounded-scaffold',
    action: 'static heuristic placeholder',
  },
  '/secrets-vault': {
    mode: 'bounded-scaffold',
    action: 'metadata-only placeholder',
  },
  '/ledgers': {
    mode: 'bounded-scaffold',
    action: 'tenant-scoped append simulation',
  },
  '/graph': {
    mode: 'bounded-scaffold',
    action: 'tenant-scoped graph query placeholder',
  },
  '/replication': {
    mode: 'bounded-scaffold',
    action: 'plan-only replication proposal',
  },
};

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method !== 'POST') {
      return json({ error: 'Only POST is supported.' }, 405);
    }

    const auth = await authenticateWorkerRequest(request, env);
    if (!auth.ok) {
      return auth.response;
    }

    const url = new URL(request.url);
    const response = scaffoldResponses[url.pathname];
    if (!response) {
      return json({ error: 'Unknown BotBase scaffold module.' }, 404);
    }

    return json({
      tenantId: auth.tenantId,
      module: url.pathname.slice(1),
      ...response,
      requestEcho: auth.body,
    });
  },
};
