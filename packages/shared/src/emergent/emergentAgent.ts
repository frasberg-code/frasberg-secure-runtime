import {
  EmergentAgent,
  type AgentIdentity,
  type AgentMemory,
  type AgentOrchestrator,
  type ModelRouter,
} from '@frasberg/frasberg-agents';
import { LuchiiModelRouter } from '@frasberg/luchii-model-router';
import { EmergentAgentOrchestrator } from './emergentAgentOrchestrator';
import type { OrchestratorRequest } from '../gt6/gt6-orchestrator';
import type { EmergentAgentRuntime } from './emergentAgentRuntime';

// Process-local memory; swap in a persistent AgentMemory for production use.
export class InMemoryAgentMemory implements AgentMemory {
  private readonly entries: Array<{ input: string; response: unknown }> = [];

  recall(input: string): string[] {
    const words = input
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    return this.entries
      .filter((e) => words.some((w) => e.input.toLowerCase().includes(w)))
      .slice(-5)
      .map((e) => e.input);
  }

  remember(input: string, response: unknown): void {
    this.entries.push({ input, response });
    if (this.entries.length > 200) this.entries.shift();
  }
}

// Sends each routed request to the Frasberg runtime endpoint for its model.
export class RuntimeAgentOrchestrator implements AgentOrchestrator {
  constructor(private readonly runtime: EmergentAgentRuntime) {}

  async run(
    input: string,
    context: { model: string; memory: string[] },
  ): Promise<unknown> {
    switch (context.model) {
      case 'luchii-music':
        return this.runtime.music({ prompt: input });
      case 'luchii-vision':
        return this.runtime.image({ prompt: input });
      case 'gt6-runtime': {
        let request: OrchestratorRequest;
        try {
          request = JSON.parse(input) as OrchestratorRequest;
        } catch {
          throw new Error(
            'GT6 requests must be JSON matching the OrchestratorRequest schema.',
          );
        }
        if (
          !request ||
          typeof request !== 'object' ||
          !request.intent ||
          typeof request.intent !== 'object' ||
          !request.permissions ||
          typeof request.permissions !== 'object' ||
          !Number.isFinite(request.maxCostWeight) ||
          !request.raceConfig ||
          typeof request.raceConfig.raceId !== 'string' ||
          !request.raceConfig.raceId ||
          !request.raceConfig.track ||
          typeof request.raceConfig.track !== 'object' ||
          !Array.isArray(request.raceConfig.cars) ||
          !Number.isFinite(request.raceConfig.lapCount) ||
          !Array.isArray(request.raceConfig.driverProfiles)
        ) {
          throw new Error(
            'GT6 request is missing required race configuration fields.',
          );
        }
        return new EmergentAgentOrchestrator(this.runtime).handle(
          request,
          request.raceConfig.raceId,
        );
      }
      default: {
        const messages =
          context.memory.length > 0
            ? [
                {
                  role: 'system',
                  content: `Relevant conversation history:\n${context.memory.join('\n')}`,
                },
                { role: 'user', content: input },
              ]
            : [{ role: 'user', content: input }];
        return this.runtime.call('/v1/chat/completions', {
          model: context.model,
          messages,
        });
      }
    }
  }
}

export function createEmergentAgent(options: {
  runtime: EmergentAgentRuntime;
  identity: AgentIdentity;
  router?: ModelRouter;
  memory?: AgentMemory;
}): EmergentAgent {
  return new EmergentAgent(
    options.router ?? new LuchiiModelRouter(),
    options.memory ?? new InMemoryAgentMemory(),
    options.identity,
    new RuntimeAgentOrchestrator(options.runtime),
  );
}
