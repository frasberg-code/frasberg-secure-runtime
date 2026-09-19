export type BuilderJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type BuilderProjectType = 'game' | 'website' | 'app' | 'native';

export interface BuilderOperationRequest {
  prompt: string;
  projectType: BuilderProjectType;
  worldId?: string;
  schemaId?: string;
  ownerId?: string;
  mode?: 'draft' | 'preview' | 'publish';
  metadata?: Record<string, unknown>;
}

export interface BuilderStep {
  id: string;
  name: string;
  kind: 'schema' | 'generate' | 'validate' | 'package';
  status: 'pending' | 'done' | 'failed';
}

export interface BuilderOperationPlan {
  id: string;
  projectType: BuilderProjectType;
  status: BuilderJobStatus;
  prompt: string;
  worldId?: string;
  schemaId?: string;
  ownerId?: string;
  steps: BuilderStep[];
  createdAt: string;
  updatedAt: string;
}

export interface BuilderOrchestrator {
  plan(request: BuilderOperationRequest): BuilderOperationPlan;
}

export class InMemoryBuilderOrchestrator implements BuilderOrchestrator {
  plan(request: BuilderOperationRequest): BuilderOperationPlan {
    const now = new Date().toISOString();
    const steps: BuilderStep[] = [
      {
        id: 'schema',
        name: 'Schema resolution',
        kind: 'schema',
        status: 'done',
      },
      {
        id: 'generate',
        name: 'Artifact generation',
        kind: 'generate',
        status: 'pending',
      },
      {
        id: 'validate',
        name: 'Validation',
        kind: 'validate',
        status: 'pending',
      },
    ];

    if (request.projectType === 'website' || request.projectType === 'app') {
      steps.push({
        id: 'package',
        name: 'Package output',
        kind: 'package',
        status: 'pending',
      });
    }

    return {
      id: `plan-${Date.now().toString(36)}`,
      projectType: request.projectType,
      status: 'queued',
      prompt: request.prompt,
      worldId: request.worldId,
      schemaId: request.schemaId,
      ownerId: request.ownerId,
      steps,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export function createBuilderOperationRequest(
  input: BuilderOperationRequest,
): BuilderOperationRequest {
  if (typeof input.prompt !== 'string' || input.prompt.trim().length === 0) {
    throw new Error('prompt must be a non-empty string.');
  }
  if (!['game', 'website', 'app', 'native'].includes(input.projectType)) {
    throw new Error('projectType must be game, website, app, or native.');
  }
  return {
    ...input,
    mode: input.mode ?? 'draft',
    metadata: input.metadata ?? {},
  };
}
