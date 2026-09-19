import { describe, expect, it } from 'vitest';
import {
  InMemoryBuilderOrchestrator,
  InMemoryWorldGraphService,
  createDefaultFullGameStackSchema,
  createWorldGraphRecord,
} from '../src';

describe('worldgraph phase 1 contracts', () => {
  it('materializes a world graph record and creates schema defaults', () => {
    const world = createWorldGraphRecord({
      name: 'skyline-race',
      kind: 'world',
      ownerId: 'owner-1',
      nodes: [
        {
          id: 'root',
          kind: 'scene',
          label: 'Root scene',
          tags: ['root'],
          config: { mode: 'race' },
        },
      ],
    });

    const schema = createDefaultFullGameStackSchema({
      name: 'Skyline Race',
      ownerId: 'owner-1',
      world,
    });

    expect(world.name).toBe('skyline-race');
    expect(schema.world.id).toBe(world.id);
    expect(schema.surfaces).toContain('game');
  });

  it('persists world records through the in-memory service', () => {
    const service = new InMemoryWorldGraphService();
    const created = service.createWorld({
      name: 'test-world',
      ownerId: 'owner-1',
      nodes: [{ id: 'node-1', kind: 'page', label: 'Start', tags: ['init'], config: { route: '/' } }],
    });

    const materialized = service.materializeScene(created.id);
    const schema = service.toSchema(created.id, { name: 'Test Schema' });

    expect(service.getWorld(created.id)?.id).toBe(created.id);
    expect(materialized.rootId).toBe('node-1');
    expect(schema.world.id).toBe(created.id);
  });

  it('builds a staged builder plan', () => {
    const orchestrator = new InMemoryBuilderOrchestrator();
    const plan = orchestrator.plan({
      prompt: 'build a racing website',
      projectType: 'website',
      worldId: 'world-1',
      mode: 'preview',
    });

    expect(plan.projectType).toBe('website');
    expect(plan.steps.some((step) => step.id === 'package')).toBe(true);
    expect(plan.status).toBe('queued');
  });
});
