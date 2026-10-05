import { describe, expect, it } from 'vitest';
import {
  WorldGraphEngine,
  type RegisterWorldGraphWorldInput,
} from '../src';

describe('world graph node/world API compatibility', () => {
  it('supports both API names over the same stored record', () => {
    const engine = new WorldGraphEngine();
    const input: RegisterWorldGraphWorldInput = {
      clusterId: 'cluster-a',
      eid: 'eid-1',
      existenceState: 'stable',
      continuityArc: 'arc-a',
      meaningScore: 0.4,
      riskProfile: 0.2,
      tags: ['seed'],
    };

    const registered = engine.registerWorld(input);
    expect(registered).toMatchObject({
      eid: 'eid-1',
      clusterId: 'cluster-a',
      meaningScore: 0.4,
    });

    expect(engine.getNode('eid-1')).toEqual(engine.getWorld('eid-1'));
    expect(engine.listNodes()).toEqual(engine.listWorlds());

    const nodeList = engine.listNodes();
    nodeList[0]!.tags.push('mutated-copy');
    expect(engine.getWorld('eid-1')?.tags).toEqual(['seed']);
  });

  it('keeps node and world removal APIs consistent', () => {
    const engine = new WorldGraphEngine();
    engine.upsertNode({
      clusterId: 'cluster-a',
      eid: 'eid-1',
      existenceState: 'stable',
      continuityArc: 'arc-a',
      meaningScore: 0.4,
      riskProfile: 0.2,
      tags: [],
    });
    engine.registerWorld({
      clusterId: 'cluster-b',
      eid: 'eid-2',
      existenceState: 'stable',
      continuityArc: 'arc-b',
      meaningScore: 0.6,
      riskProfile: 0.3,
      tags: [],
    });

    expect(engine.listNodes({ clusterId: 'cluster-a' })).toHaveLength(1);
    expect(engine.removeWorld('eid-1')?.eid).toBe('eid-1');
    expect(engine.getNode('eid-1')).toBeUndefined();
    expect(engine.removeNode('eid-2')?.eid).toBe('eid-2');
    expect(engine.listWorlds()).toEqual([]);
  });
});
