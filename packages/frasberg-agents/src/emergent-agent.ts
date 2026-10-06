export interface ModelRouter {
  route(input: string): string;
}

export interface AgentMemory {
  recall(input: string): Promise<string[]> | string[];
  remember(input: string, response: unknown): Promise<void> | void;
}

export interface AgentIdentity {
  id: string;
  workspaceId: string;
}

export interface AgentOrchestrator {
  run(
    input: string,
    context: { model: string; memory: string[]; identity: AgentIdentity },
  ): Promise<unknown>;
}

export interface AgentResult {
  model: string;
  response: unknown;
}

// The single agent runtime: route, recall, orchestrate, remember.
export class EmergentAgent {
  constructor(
    private readonly router: ModelRouter,
    private readonly memory: AgentMemory,
    private readonly identity: AgentIdentity,
    private readonly orchestrator: AgentOrchestrator,
  ) {}

  async execute(input: string): Promise<AgentResult> {
    const model = this.router.route(input);
    const memory = await this.memory.recall(input);
    const response = await this.orchestrator.run(input, {
      model,
      memory,
      identity: this.identity,
    });
    await this.memory.remember(input, response);
    return { model, response };
  }
}
