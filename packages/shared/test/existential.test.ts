import { describe, expect, it } from 'vitest';
import {
  AuditLog,
  ExistentialControlPlane,
  HypergraphEngine,
  MetaLuchiiReasoningLayer,
  OmniBridgeEngine,
  PolicyRegistry,
  QuantumContinuityEngine,
  TimelineEngine,
  WorldGraphEngine,
} from '../src';

describe('existential modules', () => {
  it('normalizes quantum amplitudes and bounds collapse updates', () => {
    const engine = new QuantumContinuityEngine();
    const created = engine.setState({
      worldId: 'world-a',
      amplitudes: [
        { id: 'a', amplitude: 2 },
        { id: 'b', amplitude: 1 },
      ],
      collapseProbability: 0.4,
    });

    expect(created.amplitudes).toEqual([
      { id: 'a', amplitude: 2 / 3 },
      { id: 'b', amplitude: 1 / 3 },
    ]);

    const lowered = engine.updateCollapseProbability('world-a', -1);
    expect(lowered.collapseProbability).toBe(0);

    const raised = engine.updateCollapseProbability('world-a', 5);
    expect(raised.collapseProbability).toBe(1);
  });

  it('handles empty and non-empty Meta-Luchii payloads', () => {
    const layer = new MetaLuchiiReasoningLayer();

    const empty = layer.reason();
    expect(empty.hasSignal).toBe(false);
    expect(empty.insights).toEqual([]);

    const populated = layer.reason({
      referenceId: 'world-a',
      prompt: 'Stabilize the continuity field',
      tags: ['continuity'],
    });
    expect(populated.hasSignal).toBe(true);
    expect(populated.conclusion).toContain('Stabilize the continuity field');
    expect(populated.insights).toHaveLength(1);
  });

  it('creates unique audit ids and returns defensive list copies', () => {
    const auditLog = new AuditLog();
    const first = auditLog.record({
      actorId: 'admin',
      action: 'first',
      target: 'world-a',
      detail: { count: 1 },
    });
    const second = auditLog.record({
      actorId: 'admin',
      action: 'second',
      target: 'world-b',
      detail: { count: 2 },
    });

    expect(first.id).not.toBe(second.id);
    const records = auditLog.list();
    records[0]!.detail.count = 99;
    expect(auditLog.list()[0]?.detail.count).toBe(1);
  });

  it('validates policy registration and updates with defensive copies', () => {
    const registry = new PolicyRegistry();
    const created = registry.registerPolicy({
      name: 'baseline',
      meaningThreshold: 0.2,
      riskThreshold: 0.4,
    });

    expect(() =>
      registry.registerPolicy({
        name: 'invalid',
        meaningThreshold: 2,
        riskThreshold: 0.4,
      }),
    ).toThrow(/meaningThreshold/i);

    const listed = registry.listPolicies();
    listed[0]!.name = 'mutated';
    expect(registry.getPolicy(created.id)?.name).toBe('baseline');

    const updated = registry.updateRegisteredPolicy(created.id, {
      riskThreshold: 0.7,
    });
    updated.name = 'changed';
    expect(registry.getPolicy(created.id)?.riskThreshold).toBe(0.7);
    expect(registry.getPolicy(created.id)?.name).toBe('baseline');
  });

  it('enforces graph invariants and cleans up world-linked hypergraph data', () => {
    const worldGraph = new WorldGraphEngine();
    const world = worldGraph.registerWorld({
      id: 'world-a',
      label: 'World A',
      eid: 'eid-a',
      existenceState: 'stable',
      continuityArc: 'arc-a',
      meaningScore: 0.4,
      riskProfile: 0.2,
      tags: ['alpha'],
    });
    const hypergraph = new HypergraphEngine(worldGraph);

    const first = hypergraph.registerNode({
      id: 'node-a',
      worldId: world.id,
      label: 'Node A',
      weight: 0.2,
    });
    const second = hypergraph.registerNode({
      id: 'node-b',
      worldId: world.id,
      label: 'Node B',
      weight: 0.4,
    });

    expect(() =>
      hypergraph.registerNode({
        id: 'node-a',
        worldId: world.id,
        label: 'Duplicate',
        weight: 0.1,
      }),
    ).toThrow(/already exists/i);

    const edge = hypergraph.registerEdge({
      id: 'edge-a',
      worldId: world.id,
      nodeIds: [first.id, second.id],
      strength: 0.6,
    });
    const cluster = hypergraph.registerCluster({
      id: 'cluster-a',
      worldId: world.id,
      nodeIds: [first.id],
      weight: 0.5,
    });

    expect(edge.nodeIds).toEqual([first.id, second.id]);
    expect(cluster.nodeIds).toEqual([first.id]);

    hypergraph.removeWorld(world.id);
    worldGraph.removeWorld(world.id);
    expect(hypergraph.listNodes(world.id)).toEqual([]);
    expect(hypergraph.listEdges(world.id)).toEqual([]);
    expect(hypergraph.listClusters(world.id)).toEqual([]);
  });

  it('validates timeline, hypergraph, and OmniBridge references', () => {
    const worldGraph = new WorldGraphEngine();
    worldGraph.registerWorld({
      id: 'world-a',
      label: 'World A',
      eid: 'eid-a',
      existenceState: 'stable',
      continuityArc: 'arc-a',
      meaningScore: 0.4,
      riskProfile: 0.2,
      tags: ['alpha'],
    });
    const hypergraph = new HypergraphEngine(worldGraph);
    const timeline = new TimelineEngine(worldGraph);
    const omniBridge = new OmniBridgeEngine(worldGraph, hypergraph, timeline);

    expect(() =>
      timeline.recordTransition({
        worldId: 'missing',
        fromArc: 'a',
        toArc: 'b',
        meaningScore: 0.4,
        riskProfile: 0.2,
      }),
    ).toThrow(/does not exist/i);

    const nodeA = hypergraph.registerNode({
      id: 'node-a',
      worldId: 'world-a',
      label: 'Node A',
      weight: 0.2,
    });
    const nodeB = hypergraph.registerNode({
      id: 'node-b',
      worldId: 'world-a',
      label: 'Node B',
      weight: 0.4,
    });
    const edge = hypergraph.registerEdge({
      id: 'edge-a',
      worldId: 'world-a',
      nodeIds: [nodeA.id, nodeB.id],
      strength: 0.6,
    });
    const event = timeline.recordTransition({
      id: 'event-a',
      worldId: 'world-a',
      fromArc: 'arc-a',
      toArc: 'arc-b',
      meaningScore: 0.5,
      riskProfile: 0.3,
    });

    expect(() =>
      omniBridge.createLink({
        worldId: 'world-a',
        timelineEventId: event.id,
      }),
    ).toThrow(/hypergraph reference/i);

    const link = omniBridge.createLink({
      id: 'link-a',
      worldId: 'world-a',
      timelineEventId: event.id,
      edgeId: edge.id,
    });
    const links = omniBridge.listLinks('world-a');
    links[0]!.edgeId = 'mutated';
    expect(link.edgeId).toBe('edge-a');
    expect(omniBridge.listLinks('world-a')[0]?.edgeId).toBe('edge-a');
  });

  it('runs control-plane cycles and generates anomalies/actions', () => {
    const controlPlane = new ExistentialControlPlane();
    controlPlane.policyRegistry.createPolicy({
      id: 'policy-a',
      name: 'strict',
      meaningThreshold: 0.5,
      riskThreshold: 0.4,
    });
    const world = controlPlane.registerWorld({
      id: 'world-a',
      label: 'World A',
      eid: 'eid-a',
      existenceState: 'stable',
      continuityArc: 'arc-a',
      meaningScore: 0.2,
      riskProfile: 0.8,
      tags: ['alpha'],
    });
    controlPlane.quantumEngine.updateCollapseProbability(world.id, 0.5);

    const cycle = controlPlane.runCycle();
    expect(cycle.anomalies.map((anomaly) => anomaly.type).sort()).toEqual([
      'collapse-instability',
      'meaning-threshold',
      'risk-threshold',
    ]);
    expect(cycle.actions).toHaveLength(3);

    const diagnostics = controlPlane.getDiagnostics();
    expect(diagnostics.status.worldCount).toBe(1);
    expect(diagnostics.note).toContain('separate adapters/deployments');
  });
});
