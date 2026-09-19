import { InMemoryBuilderOrchestrator, type BuilderOperationRequest, type BuilderOperationPlan } from '@frasberg/shared';

export interface WorldGraphRuntimeOptions {
  fetchImpl?: typeof fetch;
  worldGraphService?: {
    createWorld: (input: any) => any;
    getWorld: (id: string) => any;
    listWorlds: () => any[];
    updateWorld: (id: string, updates: any) => any;
    deleteWorld: (id: string) => any;
  };
  builderOrchestrator?: {
    plan: (request: BuilderOperationRequest) => BuilderOperationPlan;
  };
}

export function buildWorldGraphRuntimeApp(options: WorldGraphRuntimeOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const worldGraphService = options.worldGraphService ?? {
    createWorld: async () => ({ id: 'world-demo' }),
    getWorld: async () => ({ id: 'world-demo' }),
    listWorlds: () => [],
    updateWorld: async () => ({ id: 'world-demo' }),
    deleteWorld: async () => ({ id: 'world-demo' }),
  };
  const builderOrchestrator =
    options.builderOrchestrator ?? new InMemoryBuilderOrchestrator();

  return {
    async list(): Promise<unknown[]> {
      return worldGraphService.listWorlds();
    },
    async create(input: Record<string, unknown>) {
      return worldGraphService.createWorld(input);
    },
    async get(id: string) {
      return worldGraphService.getWorld(id);
    },
    async update(id: string, input: Record<string, unknown>) {
      return worldGraphService.updateWorld(id, input);
    },
    async delete(id: string) {
      return worldGraphService.deleteWorld(id);
    },
    async planBuilder(request: BuilderOperationRequest) {
      return builderOrchestrator.plan(request);
    },
    async probe(_input?: unknown) {
      const response = await fetchImpl('https://example.com/health');
      return { ok: response.ok, status: response.status };
    },
  };
}
