import { randomUUID } from 'node:crypto';
import {
  CreateGovernancePolicyInput,
  GovernanceEngine,
  GovernancePolicy,
  UpdateGovernancePolicyInput,
} from './governance';
import {
  RegisterWorldGraphWorldInput,
  WorldGraphEngine,
  WorldGraphWorld,
} from './world-graph';
import { EXISTENTIAL_SCORE_MAX, EXISTENTIAL_SCORE_MIN } from './wiring';

export interface QuantumAmplitude {
  id: string;
  amplitude: number;
}

export interface QuantumContinuityState {
  worldId: string;
  amplitudes: QuantumAmplitude[];
  collapseProbability: number;
  updatedAt: string;
}

export interface SetQuantumContinuityStateInput {
  worldId: string;
  amplitudes: QuantumAmplitude[];
  collapseProbability?: number;
}

export class QuantumContinuityEngine {
  private readonly states = new Map<string, QuantumContinuityState>();

  setState(input: SetQuantumContinuityStateInput): QuantumContinuityState {
    const worldId = readNonEmptyString(input.worldId, 'worldId');
    const amplitudes = normalizeAmplitudes(input.amplitudes);
    const collapseProbability =
      input.collapseProbability === undefined
        ? amplitudes.reduce(
            (currentMax, amplitude) =>
              amplitude.amplitude > currentMax
                ? amplitude.amplitude
                : currentMax,
            0,
          )
        : readUnitInterval(input.collapseProbability, 'collapseProbability');
    const state: QuantumContinuityState = {
      worldId,
      amplitudes,
      collapseProbability,
      updatedAt: new Date().toISOString(),
    };
    this.states.set(worldId, state);
    return copyQuantumState(state);
  }

  getState(worldId: string): QuantumContinuityState | undefined {
    const state = this.states.get(readNonEmptyString(worldId, 'worldId'));
    return state ? copyQuantumState(state) : undefined;
  }

  listStates(): QuantumContinuityState[] {
    return [...this.states.values()]
      .slice()
      .sort((left, right) => left.worldId.localeCompare(right.worldId))
      .map(copyQuantumState);
  }

  updateCollapseProbability(
    worldId: string,
    delta: number,
  ): QuantumContinuityState {
    const normalizedWorldId = readNonEmptyString(worldId, 'worldId');
    const current = this.states.get(normalizedWorldId);
    if (!current) {
      throw new Error(
        `Quantum state for world "${normalizedWorldId}" does not exist.`,
      );
    }

    if (typeof delta !== 'number' || !Number.isFinite(delta)) {
      throw new Error('delta must be a finite number.');
    }

    const next: QuantumContinuityState = {
      ...current,
      amplitudes: current.amplitudes.map(copyQuantumAmplitude),
      collapseProbability: clampUnitInterval(
        current.collapseProbability + delta,
      ),
      updatedAt: new Date().toISOString(),
    };
    this.states.set(normalizedWorldId, next);
    return copyQuantumState(next);
  }

  removeWorld(worldId: string): void {
    this.states.delete(readNonEmptyString(worldId, 'worldId'));
  }
}

export interface MetaLuchiiInsight {
  index: number;
  summary: string;
  confidence: number;
  tags: string[];
}

export interface MetaLuchiiInput {
  referenceId?: string;
  prompt?: string;
  tags?: string[];
}

export interface MetaLuchiiReasoningResult {
  traceId: string;
  referenceId?: string;
  hasSignal: boolean;
  conclusion: string;
  confidence: number;
  insights: MetaLuchiiInsight[];
  tags: string[];
}

export class MetaLuchiiReasoningLayer {
  reason(input: MetaLuchiiInput = {}): MetaLuchiiReasoningResult {
    const prompt =
      input.prompt === undefined ? undefined : readOptionalText(input.prompt);
    const tags = input.tags === undefined ? [] : readTags(input.tags, 'tags');
    const hasSignal = Boolean(prompt) || tags.length > 0;
    if (!hasSignal) {
      return {
        traceId: randomUUID(),
        referenceId: input.referenceId,
        hasSignal: false,
        conclusion: 'No meaningful payload was provided.',
        confidence: 0,
        insights: [],
        tags: [],
      };
    }

    const normalizedPrompt = prompt ?? 'Tagged existential payload';
    const conclusion = normalizedPrompt.slice(0, 160);
    const confidence = clampUnitInterval(
      Math.min(1, 0.35 + normalizedPrompt.length / 200 + tags.length * 0.1),
    );

    return {
      traceId: randomUUID(),
      referenceId: input.referenceId,
      hasSignal: true,
      conclusion,
      confidence,
      insights: [
        {
          index: 0,
          summary: `Synthesized ${normalizedPrompt}`,
          confidence,
          tags: tags.length > 0 ? [...tags] : ['meta-luchii'],
        },
      ],
      tags: tags.length > 0 ? [...tags] : ['meta-luchii'],
    };
  }
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  action: string;
  target: string;
  createdAt: string;
  detail: Record<string, unknown>;
}

export interface AuditLogPage {
  records: AuditLogRecord[];
  total: number;
}

export interface CreateAuditLogRecordInput {
  actorId: string;
  action: string;
  target: string;
  detail?: Record<string, unknown>;
}

export class AuditLog {
  private readonly entries: AuditLogRecord[] = [];

  record(input: CreateAuditLogRecordInput): AuditLogRecord {
    const record: AuditLogRecord = {
      id: randomUUID(),
      actorId: readNonEmptyString(input.actorId, 'actorId'),
      action: readNonEmptyString(input.action, 'action'),
      target: readNonEmptyString(input.target, 'target'),
      createdAt: new Date().toISOString(),
      detail: copyDetail(input.detail ?? {}),
    };
    this.entries.push(record);
    return copyAuditRecord(record);
  }

  list(): AuditLogRecord[] {
    return this.entries.map(copyAuditRecord);
  }

  listPage(options: { limit: number; offset: number }): AuditLogPage {
    const limit = readIntegerInRange(options.limit, 1, 100, 'limit');
    const offset = readIntegerInRange(options.offset, 0, 10_000, 'offset');
    return {
      records: this.entries.slice(offset, offset + limit).map(copyAuditRecord),
      total: this.entries.length,
    };
  }

  count(): number {
    return this.entries.length;
  }
}

export class PolicyRegistry extends GovernanceEngine {
  registerPolicy(input: CreateGovernancePolicyInput): GovernancePolicy {
    return this.createPolicy(input);
  }

  updateRegisteredPolicy(
    id: string,
    updates: UpdateGovernancePolicyInput,
  ): GovernancePolicy {
    return this.updatePolicy(id, updates);
  }
}

export interface ContinuitySimulationInput {
  worldId: string;
  prompt?: string;
  steps?: number;
}

export interface ContinuitySimulationResult {
  simulationId: string;
  worldId: string;
  projectedMeaningScore: number;
  projectedRiskProfile: number;
  projectedContinuityArc: string;
  collapseProbability: number;
  confidence: number;
  insights: string[];
}

export class ContinuitySimulator {
  constructor(
    private readonly worldGraph: WorldGraphEngine,
    private readonly quantumEngine: QuantumContinuityEngine,
    private readonly metaLuchii: MetaLuchiiReasoningLayer,
  ) {}

  simulate(input: ContinuitySimulationInput): ContinuitySimulationResult {
    const worldId = readNonEmptyString(input.worldId, 'worldId');
    const world = readExistingWorld(this.worldGraph, worldId);
    const steps = readIntegerInRange(input.steps ?? 1, 1, 10, 'steps');
    const reasoning = this.metaLuchii.reason({
      referenceId: worldId,
      prompt: input.prompt,
      tags: world.tags,
    });
    const state =
      this.quantumEngine.getState(worldId) ??
      this.quantumEngine.setState({
        worldId,
        amplitudes: [{ id: world.eid, amplitude: 1 }],
      });

    const meaningDelta = reasoning.hasSignal ? 0.04 * steps : 0;
    const riskDelta = state.collapseProbability * 0.03 * steps;

    return {
      simulationId: randomUUID(),
      worldId,
      projectedMeaningScore: clampUnitInterval(
        world.meaningScore + meaningDelta,
      ),
      projectedRiskProfile: clampUnitInterval(
        world.riskProfile + riskDelta - reasoning.confidence * 0.02,
      ),
      projectedContinuityArc: reasoning.hasSignal
        ? `${world.continuityArc}:simulated`
        : world.continuityArc,
      collapseProbability: state.collapseProbability,
      confidence: reasoning.confidence,
      insights: reasoning.insights.map((insight) => insight.summary),
    };
  }
}

export interface HypergraphNode {
  id: string;
  worldId: string;
  label: string;
  weight: number;
}

export interface RegisterHypergraphNodeInput {
  id?: string;
  worldId: string;
  label: string;
  weight: number;
}

export interface HypergraphEdge {
  id: string;
  worldId: string;
  nodeIds: string[];
  strength: number;
}

export interface RegisterHypergraphEdgeInput {
  id?: string;
  worldId: string;
  nodeIds: string[];
  strength: number;
}

export interface HypergraphCluster {
  id: string;
  worldId: string;
  nodeIds: string[];
  weight: number;
}

export interface RegisterHypergraphClusterInput {
  id?: string;
  worldId: string;
  nodeIds: string[];
  weight: number;
}

export class HypergraphEngine {
  private readonly nodes = new Map<string, HypergraphNode>();
  private readonly edges = new Map<string, HypergraphEdge>();
  private readonly clusters = new Map<string, HypergraphCluster>();

  constructor(private readonly worldGraph: WorldGraphEngine) {}

  registerNode(input: RegisterHypergraphNodeInput): HypergraphNode {
    const worldId = readExistingWorldId(this.worldGraph, input.worldId);
    const id =
      input.id === undefined
        ? randomUUID()
        : readNonEmptyString(input.id, 'id');
    if (this.nodes.has(id)) {
      throw new Error(`Hypergraph node "${id}" already exists.`);
    }

    const node: HypergraphNode = {
      id,
      worldId,
      label: readNonEmptyString(input.label, 'label'),
      weight: readUnitInterval(input.weight, 'weight'),
    };
    this.nodes.set(id, node);
    return copyHypergraphNode(node);
  }

  registerEdge(input: RegisterHypergraphEdgeInput): HypergraphEdge {
    const worldId = readExistingWorldId(this.worldGraph, input.worldId);
    const id =
      input.id === undefined
        ? randomUUID()
        : readNonEmptyString(input.id, 'id');
    if (this.edges.has(id)) {
      throw new Error(`Hypergraph edge "${id}" already exists.`);
    }

    const nodeIds = readUniqueIds(input.nodeIds, 'nodeIds', 2);
    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (!node || node.worldId !== worldId) {
        throw new Error(
          `Hypergraph node "${nodeId}" does not exist in world "${worldId}".`,
        );
      }
    }

    const edge: HypergraphEdge = {
      id,
      worldId,
      nodeIds,
      strength: readUnitInterval(input.strength, 'strength'),
    };
    this.edges.set(id, edge);
    return copyHypergraphEdge(edge);
  }

  registerCluster(input: RegisterHypergraphClusterInput): HypergraphCluster {
    const worldId = readExistingWorldId(this.worldGraph, input.worldId);
    const id =
      input.id === undefined
        ? randomUUID()
        : readNonEmptyString(input.id, 'id');
    if (this.clusters.has(id)) {
      throw new Error(`Hypergraph cluster "${id}" already exists.`);
    }

    const nodeIds = readUniqueIds(input.nodeIds, 'nodeIds', 1);
    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (!node || node.worldId !== worldId) {
        throw new Error(
          `Hypergraph node "${nodeId}" does not exist in world "${worldId}".`,
        );
      }
    }

    const cluster: HypergraphCluster = {
      id,
      worldId,
      nodeIds,
      weight: readUnitInterval(input.weight, 'weight'),
    };
    this.clusters.set(id, cluster);
    return copyHypergraphCluster(cluster);
  }

  getEdge(id: string): HypergraphEdge | undefined {
    const edge = this.edges.get(readNonEmptyString(id, 'id'));
    return edge ? copyHypergraphEdge(edge) : undefined;
  }

  getCluster(id: string): HypergraphCluster | undefined {
    const cluster = this.clusters.get(readNonEmptyString(id, 'id'));
    return cluster ? copyHypergraphCluster(cluster) : undefined;
  }

  listNodes(worldId?: string): HypergraphNode[] {
    const normalizedWorldId =
      worldId === undefined
        ? undefined
        : readNonEmptyString(worldId, 'worldId');
    return [...this.nodes.values()]
      .filter(
        (node) => !normalizedWorldId || node.worldId === normalizedWorldId,
      )
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(copyHypergraphNode);
  }

  listEdges(worldId?: string): HypergraphEdge[] {
    const normalizedWorldId =
      worldId === undefined
        ? undefined
        : readNonEmptyString(worldId, 'worldId');
    return [...this.edges.values()]
      .filter(
        (edge) => !normalizedWorldId || edge.worldId === normalizedWorldId,
      )
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(copyHypergraphEdge);
  }

  listClusters(worldId?: string): HypergraphCluster[] {
    const normalizedWorldId =
      worldId === undefined
        ? undefined
        : readNonEmptyString(worldId, 'worldId');
    return [...this.clusters.values()]
      .filter(
        (cluster) =>
          !normalizedWorldId || cluster.worldId === normalizedWorldId,
      )
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(copyHypergraphCluster);
  }

  removeWorld(worldId: string): void {
    const normalizedWorldId = readNonEmptyString(worldId, 'worldId');
    for (const [nodeId, node] of this.nodes.entries()) {
      if (node.worldId === normalizedWorldId) {
        this.nodes.delete(nodeId);
      }
    }
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.worldId === normalizedWorldId) {
        this.edges.delete(edgeId);
      }
    }
    for (const [clusterId, cluster] of this.clusters.entries()) {
      if (cluster.worldId === normalizedWorldId) {
        this.clusters.delete(clusterId);
      }
    }
  }
}

export interface TimelineEvent {
  id: string;
  worldId: string;
  fromArc: string;
  toArc: string;
  meaningScore: number;
  riskProfile: number;
  createdAt: string;
}

export interface RecordTimelineEventInput {
  id?: string;
  worldId: string;
  fromArc: string;
  toArc: string;
  meaningScore: number;
  riskProfile: number;
}

export class TimelineEngine {
  private readonly events = new Map<string, TimelineEvent>();

  constructor(private readonly worldGraph: WorldGraphEngine) {}

  recordTransition(input: RecordTimelineEventInput): TimelineEvent {
    const worldId = readExistingWorldId(this.worldGraph, input.worldId);
    const id =
      input.id === undefined
        ? randomUUID()
        : readNonEmptyString(input.id, 'id');
    if (this.events.has(id)) {
      throw new Error(`Timeline event "${id}" already exists.`);
    }

    const event: TimelineEvent = {
      id,
      worldId,
      fromArc: readNonEmptyString(input.fromArc, 'fromArc'),
      toArc: readNonEmptyString(input.toArc, 'toArc'),
      meaningScore: readUnitInterval(input.meaningScore, 'meaningScore'),
      riskProfile: readUnitInterval(input.riskProfile, 'riskProfile'),
      createdAt: new Date().toISOString(),
    };
    this.events.set(id, event);
    return copyTimelineEvent(event);
  }

  getEvent(id: string): TimelineEvent | undefined {
    const event = this.events.get(readNonEmptyString(id, 'id'));
    return event ? copyTimelineEvent(event) : undefined;
  }

  listEvents(worldId?: string): TimelineEvent[] {
    const normalizedWorldId =
      worldId === undefined
        ? undefined
        : readNonEmptyString(worldId, 'worldId');
    return [...this.events.values()]
      .filter(
        (event) => !normalizedWorldId || event.worldId === normalizedWorldId,
      )
      .slice()
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(copyTimelineEvent);
  }

  getEventCount(): number {
    return this.events.size;
  }

  removeWorld(worldId: string): void {
    const normalizedWorldId = readNonEmptyString(worldId, 'worldId');
    for (const [eventId, event] of this.events.entries()) {
      if (event.worldId === normalizedWorldId) {
        this.events.delete(eventId);
      }
    }
  }
}

export interface ExistentialFieldSnapshot {
  worldId: string;
  coherence: number;
  meaningScore: number;
  riskProfile: number;
  edgeCount: number;
  eventCount: number;
  updatedAt: string;
}

export class ExistentialFieldEngine {
  constructor(
    private readonly worldGraph: WorldGraphEngine,
    private readonly hypergraph: HypergraphEngine,
    private readonly timeline: TimelineEngine,
  ) {}

  sample(worldId: string): ExistentialFieldSnapshot {
    const world = readExistingWorld(this.worldGraph, worldId);
    const edgeCount = this.hypergraph.listEdges(worldId).length;
    const eventCount = this.timeline.listEvents(worldId).length;
    return {
      worldId: world.id,
      coherence: clampUnitInterval(
        (world.meaningScore + (1 - world.riskProfile)) / 2,
      ),
      meaningScore: world.meaningScore,
      riskProfile: world.riskProfile,
      edgeCount,
      eventCount,
      updatedAt: new Date().toISOString(),
    };
  }
}

export interface OmniBridgeLink {
  id: string;
  worldId: string;
  timelineEventId: string;
  edgeId?: string;
  clusterId?: string;
  createdAt: string;
}

export interface CreateOmniBridgeLinkInput {
  id?: string;
  worldId: string;
  timelineEventId: string;
  edgeId?: string;
  clusterId?: string;
}

export class OmniBridgeEngine {
  private readonly links = new Map<string, OmniBridgeLink>();

  constructor(
    private readonly worldGraph: WorldGraphEngine,
    private readonly hypergraph: HypergraphEngine,
    private readonly timeline: TimelineEngine,
  ) {}

  createLink(input: CreateOmniBridgeLinkInput): OmniBridgeLink {
    const worldId = readExistingWorldId(this.worldGraph, input.worldId);
    const id =
      input.id === undefined
        ? randomUUID()
        : readNonEmptyString(input.id, 'id');
    if (this.links.has(id)) {
      throw new Error(`OmniBridge link "${id}" already exists.`);
    }

    const timelineEventId = readNonEmptyString(
      input.timelineEventId,
      'timelineEventId',
    );
    const event = this.timeline.getEvent(timelineEventId);
    if (!event || event.worldId !== worldId) {
      throw new Error(
        `Timeline event "${timelineEventId}" does not exist in world "${worldId}".`,
      );
    }

    const edgeId =
      input.edgeId === undefined
        ? undefined
        : readNonEmptyString(input.edgeId, 'edgeId');
    if (edgeId) {
      const edge = this.hypergraph.getEdge(edgeId);
      if (!edge || edge.worldId !== worldId) {
        throw new Error(
          `Hypergraph edge "${edgeId}" does not exist in world "${worldId}".`,
        );
      }
    }

    const clusterId =
      input.clusterId === undefined
        ? undefined
        : readNonEmptyString(input.clusterId, 'clusterId');
    if (clusterId) {
      const cluster = this.hypergraph.getCluster(clusterId);
      if (!cluster || cluster.worldId !== worldId) {
        throw new Error(
          `Hypergraph cluster "${clusterId}" does not exist in world "${worldId}".`,
        );
      }
    }

    if (!edgeId && !clusterId) {
      throw new Error('At least one hypergraph reference is required.');
    }

    const link: OmniBridgeLink = {
      id,
      worldId,
      timelineEventId,
      edgeId,
      clusterId,
      createdAt: new Date().toISOString(),
    };
    this.links.set(id, link);
    return copyOmniBridgeLink(link);
  }

  listLinks(worldId?: string): OmniBridgeLink[] {
    const normalizedWorldId =
      worldId === undefined
        ? undefined
        : readNonEmptyString(worldId, 'worldId');
    return [...this.links.values()]
      .filter(
        (link) => !normalizedWorldId || link.worldId === normalizedWorldId,
      )
      .slice()
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(copyOmniBridgeLink);
  }

  removeWorld(worldId: string): void {
    const normalizedWorldId = readNonEmptyString(worldId, 'worldId');
    for (const [linkId, link] of this.links.entries()) {
      if (link.worldId === normalizedWorldId) {
        this.links.delete(linkId);
      }
    }
  }
}

export type ControlPlaneAnomalyType =
  'meaning-threshold' | 'risk-threshold' | 'collapse-instability';

export interface ControlPlaneAnomaly {
  id: string;
  worldId: string;
  type: ControlPlaneAnomalyType;
  severity: 'medium' | 'high';
  message: string;
}

export interface ControlPlaneAction {
  id: string;
  worldId: string;
  type: 'increase-meaning' | 'reduce-risk' | 'stabilize-continuity';
  reason: string;
}

export interface ControlPlaneCycleResult {
  cycleId: string;
  ranAt: string;
  anomalies: ControlPlaneAnomaly[];
  actions: ControlPlaneAction[];
}

export interface ExistentialControlPlaneStatus {
  status: 'ok';
  worldCount: number;
  policyCount: number;
  timelineEventCount: number;
  hypergraphEdgeCount: number;
  auditCount: number;
  note: string;
}

export interface ExistentialDiagnosticsSnapshot {
  status: ExistentialControlPlaneStatus;
  worlds: WorldGraphWorld[];
  policies: GovernancePolicy[];
  fieldSnapshots: ExistentialFieldSnapshot[];
  recentTimeline: TimelineEvent[];
  note: string;
}

export interface ExistentialControlPlaneOptions {
  worldGraph?: WorldGraphEngine;
  policyRegistry?: GovernanceEngine;
  quantumEngine?: QuantumContinuityEngine;
  metaLuchii?: MetaLuchiiReasoningLayer;
  hypergraph?: HypergraphEngine;
  timeline?: TimelineEngine;
  fieldEngine?: ExistentialFieldEngine;
  omniBridge?: OmniBridgeEngine;
  continuitySimulator?: ContinuitySimulator;
  auditLog?: AuditLog;
}

export class ExistentialControlPlane {
  readonly worldGraph: WorldGraphEngine;
  readonly policyRegistry: GovernanceEngine;
  readonly quantumEngine: QuantumContinuityEngine;
  readonly metaLuchii: MetaLuchiiReasoningLayer;
  readonly hypergraph: HypergraphEngine;
  readonly timeline: TimelineEngine;
  readonly fieldEngine: ExistentialFieldEngine;
  readonly omniBridge: OmniBridgeEngine;
  readonly continuitySimulator: ContinuitySimulator;
  readonly auditLog: AuditLog;

  constructor(options: ExistentialControlPlaneOptions = {}) {
    this.worldGraph = options.worldGraph ?? new WorldGraphEngine();
    this.policyRegistry = options.policyRegistry ?? new PolicyRegistry();
    this.quantumEngine = options.quantumEngine ?? new QuantumContinuityEngine();
    this.metaLuchii = options.metaLuchii ?? new MetaLuchiiReasoningLayer();
    this.hypergraph =
      options.hypergraph ?? new HypergraphEngine(this.worldGraph);
    this.timeline = options.timeline ?? new TimelineEngine(this.worldGraph);
    this.fieldEngine =
      options.fieldEngine ??
      new ExistentialFieldEngine(
        this.worldGraph,
        this.hypergraph,
        this.timeline,
      );
    this.omniBridge =
      options.omniBridge ??
      new OmniBridgeEngine(this.worldGraph, this.hypergraph, this.timeline);
    this.continuitySimulator =
      options.continuitySimulator ??
      new ContinuitySimulator(
        this.worldGraph,
        this.quantumEngine,
        this.metaLuchii,
      );
    this.auditLog = options.auditLog ?? new AuditLog();
  }

  getStatus(): ExistentialControlPlaneStatus {
    return {
      status: 'ok',
      worldCount: this.worldGraph.getWorldCount(),
      policyCount: this.policyRegistry.getPolicyCount(),
      timelineEventCount: this.timeline.getEventCount(),
      hypergraphEdgeCount: this.hypergraph.listEdges().length,
      auditCount: this.auditLog.count(),
      note: 'Existential control-plane modules are implemented here; external GPU/media engines remain separate adapters/deployments.',
    };
  }

  registerWorld(input: RegisterWorldGraphWorldInput): WorldGraphWorld {
    const world = this.worldGraph.registerWorld(input);
    this.quantumEngine.setState({
      worldId: world.id,
      amplitudes: [{ id: world.eid, amplitude: 1 }],
      collapseProbability: clampUnitInterval(
        (world.riskProfile + (1 - world.meaningScore)) / 2,
      ),
    });
    return world;
  }

  removeWorld(worldId: string): WorldGraphWorld {
    const world = this.worldGraph.removeWorld(worldId);
    if (!world) {
      throw new Error(`World "${worldId}" does not exist.`);
    }

    this.hypergraph.removeWorld(world.id);
    this.timeline.removeWorld(world.id);
    this.omniBridge.removeWorld(world.id);
    this.quantumEngine.removeWorld(world.id);
    return world;
  }

  simulateContinuity(
    input: ContinuitySimulationInput,
  ): ContinuitySimulationResult {
    return this.continuitySimulator.simulate(input);
  }

  runCycle(): ControlPlaneCycleResult {
    const now = new Date().toISOString();
    const policies = this.policyRegistry.listPolicies();
    const minMeaningThreshold =
      policies.length === 0
        ? 0
        : Math.min(...policies.map((policy) => policy.meaningThreshold));
    const minRiskThreshold =
      policies.length === 0
        ? 1
        : Math.min(...policies.map((policy) => policy.riskThreshold));
    const anomalies: ControlPlaneAnomaly[] = [];
    const actions: ControlPlaneAction[] = [];

    for (const world of this.worldGraph.listWorlds()) {
      const state =
        this.quantumEngine.getState(world.id) ??
        this.quantumEngine.setState({
          worldId: world.id,
          amplitudes: [{ id: world.eid, amplitude: 1 }],
        });

      if (world.meaningScore < minMeaningThreshold) {
        anomalies.push({
          id: randomUUID(),
          worldId: world.id,
          type: 'meaning-threshold',
          severity: 'medium',
          message: `Meaning score ${world.meaningScore.toFixed(2)} is below policy threshold ${minMeaningThreshold.toFixed(2)}.`,
        });
        actions.push({
          id: randomUUID(),
          worldId: world.id,
          type: 'increase-meaning',
          reason: 'Meaning score fell below configured policy threshold.',
        });
      }

      if (world.riskProfile > minRiskThreshold) {
        anomalies.push({
          id: randomUUID(),
          worldId: world.id,
          type: 'risk-threshold',
          severity: 'high',
          message: `Risk profile ${world.riskProfile.toFixed(2)} exceeds policy threshold ${minRiskThreshold.toFixed(2)}.`,
        });
        actions.push({
          id: randomUUID(),
          worldId: world.id,
          type: 'reduce-risk',
          reason: 'Risk profile exceeded configured policy threshold.',
        });
      }

      if (state.collapseProbability > 0.8) {
        anomalies.push({
          id: randomUUID(),
          worldId: world.id,
          type: 'collapse-instability',
          severity: 'high',
          message: `Collapse probability ${state.collapseProbability.toFixed(2)} requires stabilization.`,
        });
        actions.push({
          id: randomUUID(),
          worldId: world.id,
          type: 'stabilize-continuity',
          reason: 'Collapse probability exceeded safe operating range.',
        });
      }
    }

    return {
      cycleId: randomUUID(),
      ranAt: now,
      anomalies: anomalies.map(copyControlPlaneAnomaly),
      actions: actions.map(copyControlPlaneAction),
    };
  }

  getDiagnostics(): ExistentialDiagnosticsSnapshot {
    const worlds = this.worldGraph.listWorlds();
    return {
      status: this.getStatus(),
      worlds,
      policies: this.policyRegistry.listPolicies(),
      fieldSnapshots: worlds.map((world) => this.fieldEngine.sample(world.id)),
      recentTimeline: this.timeline.listEvents().slice(-10),
      note: 'Diagnostics expose domain/control-plane state only; GPU/media execution remains in separate adapters/deployments.',
    };
  }
}

function normalizeAmplitudes(
  amplitudes: QuantumAmplitude[],
): QuantumAmplitude[] {
  if (!Array.isArray(amplitudes) || amplitudes.length === 0) {
    throw new Error('amplitudes must be a non-empty array.');
  }

  const seenIds = new Set<string>();
  const normalized = amplitudes.map((amplitude, index) => {
    const id = readNonEmptyString(amplitude?.id, `amplitudes[${index}].id`);
    if (seenIds.has(id)) {
      throw new Error(`amplitudes[${index}].id must be unique.`);
    }
    seenIds.add(id);

    if (
      typeof amplitude.amplitude !== 'number' ||
      !Number.isFinite(amplitude.amplitude) ||
      amplitude.amplitude < 0
    ) {
      throw new Error(
        `amplitudes[${index}].amplitude must be a finite number greater than or equal to 0.`,
      );
    }

    return {
      id,
      amplitude: amplitude.amplitude,
    };
  });

  const total = normalized.reduce(
    (sum, amplitude) => sum + amplitude.amplitude,
    0,
  );
  if (total <= 0) {
    throw new Error('amplitudes must sum to a value greater than 0.');
  }

  return normalized.map((amplitude) => ({
    id: amplitude.id,
    amplitude: amplitude.amplitude / total,
  }));
}

function copyQuantumAmplitude(amplitude: QuantumAmplitude): QuantumAmplitude {
  return {
    ...amplitude,
  };
}

function copyQuantumState(
  state: QuantumContinuityState,
): QuantumContinuityState {
  return {
    ...state,
    amplitudes: state.amplitudes.map(copyQuantumAmplitude),
  };
}

function copyAuditRecord(record: AuditLogRecord): AuditLogRecord {
  return {
    ...record,
    detail: copyDetail(record.detail),
  };
}

function copyHypergraphNode(node: HypergraphNode): HypergraphNode {
  return {
    ...node,
  };
}

function copyHypergraphEdge(edge: HypergraphEdge): HypergraphEdge {
  return {
    ...edge,
    nodeIds: [...edge.nodeIds],
  };
}

function copyHypergraphCluster(cluster: HypergraphCluster): HypergraphCluster {
  return {
    ...cluster,
    nodeIds: [...cluster.nodeIds],
  };
}

function copyTimelineEvent(event: TimelineEvent): TimelineEvent {
  return {
    ...event,
  };
}

function copyOmniBridgeLink(link: OmniBridgeLink): OmniBridgeLink {
  return {
    ...link,
  };
}

function copyControlPlaneAnomaly(
  anomaly: ControlPlaneAnomaly,
): ControlPlaneAnomaly {
  return {
    ...anomaly,
  };
}

function copyControlPlaneAction(
  action: ControlPlaneAction,
): ControlPlaneAction {
  return {
    ...action,
  };
}

function copyDetail(detail: Record<string, unknown>): Record<string, unknown> {
  return { ...detail };
}

function readExistingWorld(
  worldGraph: WorldGraphEngine,
  worldId: string,
): WorldGraphWorld {
  const world = worldGraph.getWorld(readNonEmptyString(worldId, 'worldId'));
  if (!world) {
    throw new Error(`World "${worldId}" does not exist.`);
  }

  return world;
}

function readExistingWorldId(
  worldGraph: WorldGraphEngine,
  worldId: string,
): string {
  return readExistingWorld(worldGraph, worldId).id;
}

function readUniqueIds(
  value: unknown,
  label: string,
  minimumLength: number,
): string[] {
  if (!Array.isArray(value) || value.length < minimumLength) {
    throw new Error(`${label} must contain at least ${minimumLength} item(s).`);
  }

  const seen = new Set<string>();
  return value.map((entry, index) => {
    const id = readNonEmptyString(entry, `${label}[${index}]`);
    if (seen.has(id)) {
      throw new Error(`${label}[${index}] must be unique.`);
    }
    seen.add(id);
    return id;
  });
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function readOptionalText(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return readNonEmptyString(value, 'prompt');
}

function readTags(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value.map((entry, index) =>
    readNonEmptyString(entry, `${label}[${index}]`),
  );
}

function readIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }

  if (value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }

  return value;
}

function readUnitInterval(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  if (value < EXISTENTIAL_SCORE_MIN || value > EXISTENTIAL_SCORE_MAX) {
    throw new Error(
      `${label} must be between ${EXISTENTIAL_SCORE_MIN} and ${EXISTENTIAL_SCORE_MAX}.`,
    );
  }

  return value;
}

function clampUnitInterval(value: number): number {
  if (value < EXISTENTIAL_SCORE_MIN) {
    return EXISTENTIAL_SCORE_MIN;
  }

  if (value > EXISTENTIAL_SCORE_MAX) {
    return EXISTENTIAL_SCORE_MAX;
  }

  return value;
}
