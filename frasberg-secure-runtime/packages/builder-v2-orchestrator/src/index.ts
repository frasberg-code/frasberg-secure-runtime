import { randomUUID } from 'node:crypto';
import type { JobState } from '@frasberg/shared';
import {
  FULL_GAME_STACK_SCHEMA_VERSION,
  validateWorldDefinition,
  type WorldDefinition,
  type WorldDefinitionKind,
} from '@frasberg/full-game-stack-schema';

export interface BuilderIntentRequest {
  prompt: string;
  target: WorldDefinitionKind;
  tenantId: string;
  requestedBy: string;
  tags: string[];
}

export type BuilderJobStatus = JobState;

export interface BuilderJobDescriptor {
  id: string;
  tenantId: string;
  state: BuilderJobStatus;
  createdAt: string;
  updatedAt: string;
  target: WorldDefinitionKind;
  intent: BuilderIntentRequest;
  worldGraphId?: string;
}

export interface BuilderResult {
  jobId: string;
  status: BuilderJobStatus;
  artifactId?: string;
  artifactUri?: string;
  diagnostics: string[];
  worldDefinition?: WorldDefinition;
}

export interface BuilderOrchestrator {
  createWorldGraphFromPrompt(
    request: BuilderIntentRequest,
  ): Promise<{ job: BuilderJobDescriptor; worldDefinition: WorldDefinition }>;
  buildArtifact(jobDescriptor: BuilderJobDescriptor): Promise<BuilderResult>;
  getJobStatus(jobId: string): Promise<BuilderResult>;
}

/**
 * Contract-test fixture only. This no-op orchestrator exists to validate the
 * boundary shape without claiming any production builder implementation.
 */
export class ReferenceBuilderOrchestratorFixture implements BuilderOrchestrator {
  private readonly results = new Map<string, BuilderResult>();

  async createWorldGraphFromPrompt(
    request: BuilderIntentRequest,
  ): Promise<{ job: BuilderJobDescriptor; worldDefinition: WorldDefinition }> {
    const intent = validateBuilderIntentRequest(request);
    const worldDefinition = createFixtureWorldDefinition(intent);
    const now = new Date().toISOString();
    const job: BuilderJobDescriptor = {
      id: randomUUID(),
      tenantId: intent.tenantId,
      state: 'queued',
      createdAt: now,
      updatedAt: now,
      target: intent.target,
      intent,
      worldGraphId: worldDefinition.id,
    };

    this.results.set(job.id, {
      jobId: job.id,
      status: 'queued',
      diagnostics: ['fixture-worldgraph-created'],
      worldDefinition,
    });

    return { job, worldDefinition };
  }

  async buildArtifact(
    jobDescriptor: BuilderJobDescriptor,
  ): Promise<BuilderResult> {
    const job = validateBuilderJobDescriptor(jobDescriptor);
    const existing = this.results.get(job.id);
    const completed: BuilderResult = {
      jobId: job.id,
      status: 'completed',
      artifactId: `${job.id}-artifact`,
      artifactUri: `fixture://builder-v2/${job.id}`,
      diagnostics: ['fixture-artifact-built'],
      worldDefinition: existing?.worldDefinition,
    };
    this.results.set(job.id, completed);
    return completed;
  }

  async getJobStatus(jobId: string): Promise<BuilderResult> {
    const normalizedJobId = readNonEmptyString(jobId, 'jobId');
    const result = this.results.get(normalizedJobId);
    if (!result) {
      throw new Error(`Unknown builder job "${normalizedJobId}".`);
    }
    return copyBuilderResult(result);
  }
}

export function validateBuilderIntentRequest(
  value: unknown,
  label = 'builderIntentRequest',
): BuilderIntentRequest {
  const object = readObject(value, label);
  return {
    prompt: readNonEmptyString(object.prompt, `${label}.prompt`),
    target: readTarget(object.target, `${label}.target`),
    tenantId: readNonEmptyString(object.tenantId, `${label}.tenantId`),
    requestedBy: readNonEmptyString(object.requestedBy, `${label}.requestedBy`),
    tags: readStringArray(object.tags, `${label}.tags`),
  };
}

export function validateBuilderJobDescriptor(
  value: unknown,
  label = 'builderJobDescriptor',
): BuilderJobDescriptor {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    tenantId: readNonEmptyString(object.tenantId, `${label}.tenantId`),
    state: readJobStatus(object.state, `${label}.state`),
    createdAt: readNonEmptyString(object.createdAt, `${label}.createdAt`),
    updatedAt: readNonEmptyString(object.updatedAt, `${label}.updatedAt`),
    target: readTarget(object.target, `${label}.target`),
    intent: validateBuilderIntentRequest(object.intent, `${label}.intent`),
    worldGraphId:
      object.worldGraphId === undefined
        ? undefined
        : readNonEmptyString(object.worldGraphId, `${label}.worldGraphId`),
  };
}

export function validateBuilderResult(
  value: unknown,
  label = 'builderResult',
): BuilderResult {
  const object = readObject(value, label);
  return {
    jobId: readNonEmptyString(object.jobId, `${label}.jobId`),
    status: readJobStatus(object.status, `${label}.status`),
    artifactId:
      object.artifactId === undefined
        ? undefined
        : readNonEmptyString(object.artifactId, `${label}.artifactId`),
    artifactUri:
      object.artifactUri === undefined
        ? undefined
        : readNonEmptyString(object.artifactUri, `${label}.artifactUri`),
    diagnostics: readStringArray(object.diagnostics, `${label}.diagnostics`),
    worldDefinition:
      object.worldDefinition === undefined
        ? undefined
        : validateWorldDefinition(
            object.worldDefinition,
            `${label}.worldDefinition`,
          ),
  };
}

function createFixtureWorldDefinition(
  request: BuilderIntentRequest,
): WorldDefinition {
  return validateWorldDefinition({
    id: `wg-${randomUUID()}`,
    name: request.prompt,
    kind: request.target,
    metadata: {
      schemaVersion: FULL_GAME_STACK_SCHEMA_VERSION,
      createdWith: 'ReferenceBuilderOrchestratorFixture',
      tags: [...request.tags],
    },
    scenes:
      request.target === 'game'
        ? [{ id: 'scene-1', name: 'Scene 1', components: [], actions: [] }]
        : [],
    pages:
      request.target === 'site'
        ? [{ id: 'page-1', title: 'Page 1', components: [], actions: [] }]
        : [],
    screens:
      request.target === 'app'
        ? [{ id: 'screen-1', title: 'Screen 1', components: [], actions: [] }]
        : [],
    flows:
      request.target === 'app'
        ? [{ id: 'flow-1', name: 'Flow 1', stepIds: ['screen-1'], actions: [] }]
        : [],
    routes:
      request.target === 'site'
        ? [
            {
              id: 'route-1',
              path: '/',
              targetKind: 'page',
              targetId: 'page-1',
              guards: [],
            },
          ]
        : request.target === 'app'
          ? [
              {
                id: 'route-1',
                path: '/app',
                targetKind: 'screen',
                targetId: 'screen-1',
                guards: [],
              },
            ]
          : [],
    vehicleClasses: [],
  });
}

function copyBuilderResult(result: BuilderResult): BuilderResult {
  return {
    ...result,
    diagnostics: [...result.diagnostics],
    worldDefinition:
      result.worldDefinition === undefined
        ? undefined
        : validateWorldDefinition(result.worldDefinition),
  };
}

function readObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function readStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value.map((entry, index) =>
    readNonEmptyString(entry, `${label}[${index}]`),
  );
}

function readTarget(value: unknown, label: string): WorldDefinitionKind {
  if (value !== 'game' && value !== 'app' && value !== 'site') {
    throw new Error(`${label} must be one of: game, app, site.`);
  }
  return value;
}

function readJobStatus(value: unknown, label: string): BuilderJobStatus {
  if (
    value !== 'queued' &&
    value !== 'running' &&
    value !== 'completed' &&
    value !== 'failed'
  ) {
    throw new Error(
      `${label} must be one of: queued, running, completed, failed.`,
    );
  }
  return value;
}
