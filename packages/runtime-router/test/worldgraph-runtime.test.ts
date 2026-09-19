import { describe, expect, it } from 'vitest';
import { buildWorldGraphRuntimeApp } from '../src';
import { InMemoryBuilderOrchestrator, InMemoryWorldGraphService } from '@frasberg/shared';

describe('worldgraph runtime contract', () => {
  it('creates, lists, and plans worldgraph operations', async () => {
    const app = buildWorldGraphRuntimeApp({
      service: new InMemoryWorldGraphService(),
      builderOrchestrator: new InMemoryBuilderOrchestrator(),
    });

    const created = await app.inject({
      method: 'POST',
      url: '/v1/worldgraph/worlds',
      payload: {
        name: 'runtime-world',
        kind: 'world',
        ownerId: 'owner-1',
        nodes: [{ id: 'root', kind: 'scene', label: 'Root', tags: ['root'], config: { mode: 'runtime' } }],
      },
    });

    expect(created.statusCode).toBe(201);
    const world = created.json() as { id: string; name: string };
    expect(world.name).toBe('runtime-world');

    const listed = await app.inject({
      method: 'GET',
      url: '/v1/worldgraph/worlds',
    });
    expect(listed.statusCode).toBe(200);
    expect((listed.json() as { worlds: { id: string }[] }).worlds.length).toBeGreaterThan(0);

    const planned = await app.inject({
      method: 'POST',
      url: '/v1/worldgraph/builders/plan',
      payload: {
        prompt: 'build a website experience',
        projectType: 'website',
        worldId: world.id,
      },
    });

    expect(planned.statusCode).toBe(200);
    expect((planned.json() as { projectType: string }).projectType).toBe('website');
  });
});
