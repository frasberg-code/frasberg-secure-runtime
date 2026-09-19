import { describe, expect, it } from 'vitest';
import { GovernanceEngine, WorldGraphEngine } from '@frasberg/shared';
import { AnomalyEngine } from '../src/anomaly-engine';
import { DiagnosticsEngine } from '../src/diagnostics';
import { WorldGraphObserver } from '../src/observer';

describe('tier 12 runtime hardening', () => {
  it('observer snapshots world-graph state through public APIs', () => {
    const worldGraph = new WorldGraphEngine();
    worldGraph.upsertNode({
      clusterId: 'alpha',
      eid: 'eid-1',
      existenceState: 'stable',
      continuityArc: 'arc-a',
      meaningScore: 0.4,
      riskProfile: 0.2,
      tags: ['music'],
    });

    const observer = new WorldGraphObserver(worldGraph);
    const snapshot = observer.createSnapshot('alpha');

    expect(snapshot.nodeCount).toBe(1);
    expect(snapshot.clusterId).toBe('alpha');
    expect(snapshot.nodes[0]?.eid).toBe('eid-1');
    expect(snapshot.snapshotId).toBeTruthy();
  });

  it('detects meaning/risk spikes and arc flips with validated thresholds', () => {
    const worldGraph = new WorldGraphEngine();
    const anomaly = new AnomalyEngine(worldGraph, {
      meaningSpikeThreshold: 0.3,
      riskSpikeThreshold: 0.2,
    });

    worldGraph.upsertNode({
      clusterId: 'alpha',
      eid: 'eid-1',
      existenceState: 'stable',
      continuityArc: 'arc-a',
      meaningScore: 0.1,
      riskProfile: 0.1,
      tags: ['seed'],
    });
    expect(anomaly.detect()).toHaveLength(0);

    worldGraph.upsertNode({
      clusterId: 'alpha',
      eid: 'eid-1',
      existenceState: 'stable',
      continuityArc: 'arc-b',
      meaningScore: 0.9,
      riskProfile: 0.8,
      tags: ['seed'],
    });
    const anomalies = anomaly.detect();
    expect(anomalies.map((entry) => entry.type).sort()).toEqual([
      'arc-flip',
      'meaning-spike',
      'risk-spike',
    ]);

    const clamped = anomaly.updateThresholds({ meaningSpikeThreshold: 10 });
    expect(clamped.meaningSpikeThreshold).toBe(1);
  });

  it('creates diagnostics reports and keeps per-eid failures isolated', async () => {
    const worldGraph = new WorldGraphEngine();
    worldGraph.upsertNode({
      clusterId: 'alpha',
      eid: 'eid-1',
      existenceState: 'stable',
      continuityArc: 'arc-a',
      meaningScore: 0.3,
      riskProfile: 0.2,
      tags: ['a'],
    });

    const governance = new GovernanceEngine();
    governance.createPolicy({
      name: 'default',
      meaningThreshold: 0.4,
      riskThreshold: 0.5,
    });

    const anomaly = new AnomalyEngine(worldGraph);
    anomaly.detect();
    worldGraph.upsertNode({
      clusterId: 'alpha',
      eid: 'eid-1',
      existenceState: 'stable',
      continuityArc: 'arc-b',
      meaningScore: 0.9,
      riskProfile: 0.9,
      tags: ['a'],
    });

    const diagnostics = new DiagnosticsEngine(worldGraph, governance, anomaly, {
      sampleCollapseProbability: async (eid: string) => {
        if (eid === 'bad-eid') {
          throw new Error('sampling failed');
        }
        return 2;
      },
    });

    const report = await diagnostics.generateReport({
      sampleEids: ['eid-1', 'bad-eid'],
      clusterId: 'alpha',
    });

    expect(report.worldCount).toBe(1);
    expect(report.policyCount).toBe(1);
    expect(report.anomalyCount).toBeGreaterThan(0);
    expect(report.sampledCollapses).toEqual([
      { eid: 'eid-1', probability: 1 },
      { eid: 'bad-eid', error: 'sampling failed' },
    ]);
  });

  it('rejects invalid diagnostics sample input', async () => {
    const diagnostics = new DiagnosticsEngine(
      new WorldGraphEngine(),
      new GovernanceEngine(),
      new AnomalyEngine(new WorldGraphEngine()),
      { sampleCollapseProbability: () => 0.5 },
    );

    await expect(
      diagnostics.generateReport({ sampleEids: ['ok', ''] }),
    ).rejects.toThrow(/sampleEids\[1\]/i);
  });
});
