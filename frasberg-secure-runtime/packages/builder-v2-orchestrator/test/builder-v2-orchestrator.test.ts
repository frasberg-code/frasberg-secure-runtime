import { describe, expect, it } from 'vitest';
import {
  ReferenceBuilderOrchestratorFixture,
  validateBuilderJobDescriptor,
  validateBuilderResult,
  type BuilderOrchestrator,
} from '../src';

describe('builder-v2 orchestrator contracts', () => {
  it('exposes a fixture that satisfies the orchestrator interface', async () => {
    const orchestrator: BuilderOrchestrator =
      new ReferenceBuilderOrchestratorFixture();

    const created = await orchestrator.createWorldGraphFromPrompt({
      prompt: 'Build a GT landing site',
      target: 'site',
      tenantId: 'tenant-1',
      requestedBy: 'user-1',
      tags: ['marketing'],
    });
    const build = await orchestrator.buildArtifact(created.job);
    const status = await orchestrator.getJobStatus(created.job.id);

    expect(created.worldDefinition.kind).toBe('site');
    expect(validateBuilderJobDescriptor(created.job)).toEqual(created.job);
    expect(validateBuilderResult(build)).toEqual(build);
    expect(status.status).toBe('completed');
    expect(status.artifactUri).toMatch(/^fixture:\/\//);
  });

  it('rejects invalid descriptor shapes', () => {
    expect(() =>
      validateBuilderJobDescriptor({
        id: 'job-1',
        tenantId: 'tenant-1',
        state: 'queued',
        createdAt: 'now',
        updatedAt: 'later',
        target: 'app',
        intent: {
          prompt: '',
          target: 'app',
          tenantId: 'tenant-1',
          requestedBy: 'user-1',
          tags: [],
        },
      }),
    ).toThrow(/intent\.prompt/i);
  });
});
