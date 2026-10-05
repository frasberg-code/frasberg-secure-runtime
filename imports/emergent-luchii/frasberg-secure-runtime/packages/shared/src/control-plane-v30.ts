import { randomUUID } from 'node:crypto';
import { GovernanceEngine, GovernancePolicy } from './governance';
import { WorldGraphEngine, WorldGraphNode } from './world-graph';

export type ControlActionType = 'throttle' | 'decommission' | 'flag' | 'noop';

export interface DiagnosticSample {
  eid: string;
  meaningScore: number;
  riskProfile: number;
  continuityArc: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface DiagnosticsReport {
  samples: DiagnosticSample[];
  generatedAt: string;
}

export interface AnomalyRecord {
  id: string;
  eid: string;
  type: 'risk-spike' | 'meaning-drop' | 'continuity-instability';
  details: string;
}

export interface AnomalyScan {
  anomalies: AnomalyRecord[];
  scannedAt: string;
}

export interface ControlAction {
  id: string;
  type: ControlActionType;
  targetEid?: string;
  reason: string;
}

export interface ControlPlaneConfig {
  worldGraph: WorldGraphEngine;
  governance: GovernanceEngine;
  diagnostics?: DiagnosticsEngine;
  anomalies?: AnomalyEngine;
  audit?: AuditLogV30;
}

export class DiagnosticsEngine {
  constructor(
    private readonly worldGraph: WorldGraphEngine,
    private readonly governance: GovernanceEngine,
  ) {}

  run(sampleEids: string[] = []): DiagnosticsReport {
    const nodes = sampleEids.length === 0
      ? this.worldGraph.listNodes()
      : sampleEids.map((eid) => this.worldGraph.getNode(eid)).filter((node): node is WorldGraphNode => node !== undefined);
    return {
      generatedAt: new Date().toISOString(),
      samples: nodes.map((node) => ({
        eid: node.eid,
        meaningScore: node.meaningScore,
        riskProfile: node.riskProfile,
        continuityArc: node.continuityArc,
        status: node.riskProfile > 0.8 || node.meaningScore < 0.2 ? 'critical' : node.riskProfile > 0.6 || node.meaningScore < 0.4 ? 'warning' : 'healthy',
      })),
    };
  }
}

export class AnomalyEngine {
  constructor(private readonly worldGraph: WorldGraphEngine) {}

  scan(): AnomalyScan {
    const anomalies: AnomalyRecord[] = [];
    for (const node of this.worldGraph.listNodes()) {
      if (node.riskProfile > 0.8) anomalies.push({ id: randomUUID(), eid: node.eid, type: 'risk-spike', details: `Risk profile ${node.riskProfile.toFixed(2)} exceeds 0.80.` });
      if (node.meaningScore < 0.2) anomalies.push({ id: randomUUID(), eid: node.eid, type: 'meaning-drop', details: `Meaning score ${node.meaningScore.toFixed(2)} is below 0.20.` });
      if (node.continuityArc === 'collapsing' || node.continuityArc === 'extinct') anomalies.push({ id: randomUUID(), eid: node.eid, type: 'continuity-instability', details: `Continuity arc is ${node.continuityArc}.` });
    }
    return { anomalies, scannedAt: new Date().toISOString() };
  }
}

export interface AuditEntryV30 {
  id: string;
  timestamp: string;
  actor: 'user' | 'system' | 'engine';
  action: string;
  target?: string;
  metadata: Record<string, unknown>;
}

export class AuditLogV30 {
  private readonly entries: AuditEntryV30[] = [];

  record(entry: Omit<AuditEntryV30, 'id' | 'timestamp'>): AuditEntryV30 {
    const full = { ...entry, id: randomUUID(), timestamp: new Date().toISOString(), metadata: { ...entry.metadata } };
    this.entries.push(full);
    return { ...full, metadata: { ...full.metadata } };
  }

  list(limit = 100): AuditEntryV30[] {
    const bounded = Math.max(1, Math.min(1000, Math.trunc(limit)));
    return this.entries.slice(-bounded).map((entry) => ({ ...entry, metadata: { ...entry.metadata } }));
  }
}

export class PolicyRegistryV30 {
  private readonly policies = new Map<string, GovernancePolicy>();

  register(policy: GovernancePolicy): GovernancePolicy {
    this.policies.set(policy.id, { ...policy });
    return { ...policy };
  }

  get(id: string): GovernancePolicy | undefined {
    const policy = this.policies.get(id);
    return policy ? { ...policy } : undefined;
  }

  list(): GovernancePolicy[] { return [...this.policies.values()].map((policy) => ({ ...policy })); }
}

export class ControlPlane {
  private readonly diagnostics: DiagnosticsEngine;
  private readonly anomalies: AnomalyEngine;
  private readonly audit: AuditLogV30;

  constructor(private readonly cfg: ControlPlaneConfig) {
    this.diagnostics = cfg.diagnostics ?? new DiagnosticsEngine(cfg.worldGraph, cfg.governance);
    this.anomalies = cfg.anomalies ?? new AnomalyEngine(cfg.worldGraph);
    this.audit = cfg.audit ?? new AuditLogV30();
  }

  runGlobalCycle(sampleEids: string[] = []): ControlAction[] {
    const report = this.diagnostics.run(sampleEids);
    const scan = this.anomalies.scan();
    const actions = scan.anomalies.map((anomaly): ControlAction => ({
      id: `ctrl-${randomUUID()}`,
      type: anomaly.type === 'risk-spike' ? 'throttle' : anomaly.type === 'continuity-instability' ? 'decommission' : 'flag',
      targetEid: anomaly.eid,
      reason: anomaly.details,
    }));
    this.audit.record({ actor: 'system', action: 'control-cycle', metadata: { diagnostics: report.samples.length, anomalies: scan.anomalies.length, actions: actions.length } });
    return actions;
  }

  getAuditLog(): AuditEntryV30[] { return this.audit.list(); }
}
