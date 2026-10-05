import { randomUUID } from 'node:crypto';
import { WorldGraphEngine, WorldGraphNode } from './world-graph';
import {
  ContinuityArc,
  ExistentialContext,
  updateExistentialContext,
} from './wiring';
import { HypergraphEngine } from './existential';
import { LuchiiRuntime } from './luchii';
import { MetaCognition } from './meta-cognition';

export interface WorldCluster {
  id: string;
  label: string;
  nodeIds: string[];
  tags: string[];
}

export class ClusterEngine {
  private readonly clusters = new Map<string, WorldCluster>();

  constructor(private readonly worldGraph: WorldGraphEngine) {}

  createCluster(
    id: string,
    label: string,
    nodeIds: string[],
    tags: string[] = [],
  ): WorldCluster {
    if (this.clusters.has(id)) throw new Error(`Cluster "${id}" already exists.`);
    const cluster = { id, label, nodeIds: [...new Set(nodeIds)], tags: [...tags] };
    this.clusters.set(id, cluster);
    return copyCluster(cluster);
  }

  getCluster(id: string): WorldCluster | undefined {
    const cluster = this.clusters.get(id);
    return cluster ? copyCluster(cluster) : undefined;
  }

  addNodeToCluster(clusterId: string, eid: string): WorldCluster | undefined {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return undefined;
    if (!cluster.nodeIds.includes(eid)) cluster.nodeIds.push(eid);
    return copyCluster(cluster);
  }

  removeNodeFromCluster(clusterId: string, eid: string): WorldCluster | undefined {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return undefined;
    cluster.nodeIds = cluster.nodeIds.filter((id) => id !== eid);
    return copyCluster(cluster);
  }

  getClusterNodes(clusterId: string): WorldGraphNode[] {
    return (this.clusters.get(clusterId)?.nodeIds ?? [])
      .map((id) => this.worldGraph.getNode(id))
      .filter((node): node is WorldGraphNode => node !== undefined);
  }

  listClusters(): WorldCluster[] {
    return [...this.clusters.values()].map(copyCluster);
  }
}

export type FederationLinkType = 'alliance' | 'conflict' | 'trade' | 'mythic-bridge';
export interface FederationLink {
  id: string;
  fromWorld: string;
  toWorld: string;
  type: FederationLinkType;
  weight: number;
}

export class FederationEngine {
  private readonly links = new Map<string, FederationLink>();

  constructor(private readonly worldGraph: WorldGraphEngine) {}

  createFederationLink(input: Omit<FederationLink, 'id'> & { id?: string }): FederationLink {
    const id = input.id ?? `fed-${input.fromWorld}-${input.toWorld}-${input.type}`;
    const link = { ...input, id };
    this.links.set(id, link);
    return { ...link };
  }

  getFederationLinksForWorld(eid: string): FederationLink[] {
    return [...this.links.values()]
      .filter((link) => link.fromWorld === eid || link.toWorld === eid)
      .map((link) => ({ ...link }));
  }

  listFederatedWorlds(): WorldGraphNode[] {
    const ids = new Set(
      [...this.links.values()].flatMap((link) => [link.fromWorld, link.toWorld]),
    );
    return [...ids]
      .map((id) => this.worldGraph.getNode(id))
      .filter((node): node is WorldGraphNode => node !== undefined);
  }
}

export interface ContinuityStep {
  eid: string;
  fromArc: ContinuityArc;
  toArc: ContinuityArc;
  meaningScore: number;
  riskProfile: number;
}

export interface ContinuitySimulationResultV30 {
  steps: ContinuityStep[];
  summary: string;
}

export class ContinuityArcSimulator {
  constructor(private readonly worldGraph: WorldGraphEngine) {}

  simulateCluster(cluster: WorldCluster): ContinuitySimulationResultV30 {
    const steps: ContinuityStep[] = [];
    for (const eid of cluster.nodeIds) {
      const node = this.worldGraph.getNode(eid);
      if (!node) continue;
      const toArc = this.nextArc(node);
      const updated = updateExistentialContext(node, {
        continuityArc: toArc,
        meaningScore: node.meaningScore * (toArc === 'collapsing' ? 0.9 : 1.05),
        riskProfile:
          toArc === 'collapsing'
            ? Math.min(1, node.riskProfile + 0.1)
            : Math.max(0, node.riskProfile - 0.05),
      });
      this.worldGraph.upsertNode({ ...node, ...updated });
      steps.push({
        eid,
        fromArc: node.continuityArc as ContinuityArc,
        toArc,
        meaningScore: updated.meaningScore,
        riskProfile: updated.riskProfile,
      });
    }
    return {
      steps,
      summary: `Simulated continuity for ${steps.length} entities in cluster ${cluster.id}.`,
    };
  }

  private nextArc(ctx: ExistentialContext): ContinuityArc {
    if (ctx.continuityArc === 'collapsing' && ctx.riskProfile > 0.8) return 'extinct';
    if (ctx.continuityArc === 'stable' && ctx.meaningScore > 0.7) return 'emerging';
    if (ctx.continuityArc === 'emerging' && ctx.riskProfile > 0.6) return 'collapsing';
    return ctx.continuityArc as ContinuityArc;
  }
}

export interface HyperEdgeV30 {
  id: string;
  nodes: string[];
  type: string;
  weight: number;
  data: Record<string, unknown>;
}

export class HypergraphV30Engine {
  private readonly hyperedges = new Map<string, HyperEdgeV30>();

  constructor(private readonly worldGraph: WorldGraphEngine) {}

  syncFromWorldGraph(): void {
    // The shared HypergraphEngine owns validated world-scoped graph records.
    // This method intentionally only manages v30 multi-node hyperedges.
    void this.worldGraph;
  }

  addHyperEdge(edge: HyperEdgeV30): HyperEdgeV30 {
    this.hyperedges.set(edge.id, { ...edge, nodes: [...edge.nodes], data: { ...edge.data } });
    return this.getHyperEdge(edge.id)!;
  }

  getHyperEdge(id: string): HyperEdgeV30 | undefined {
    const edge = this.hyperedges.get(id);
    return edge ? { ...edge, nodes: [...edge.nodes], data: { ...edge.data } } : undefined;
  }

  listHyperEdges(): HyperEdgeV30[] {
    return [...this.hyperedges.values()].map((edge) => this.getHyperEdge(edge.id)!);
  }

  findHyperEdgesByType(type: string): HyperEdgeV30[] {
    return this.listHyperEdges().filter((edge) => edge.type === type);
  }

  connectWorlds(worldIds: string[], type: string, weight = 1): HyperEdgeV30 {
    if (worldIds.length < 2) throw new Error('A hyperedge requires at least two worlds.');
    return this.addHyperEdge({
      id: `hyper-${type}-${randomUUID()}`,
      nodes: [...new Set(worldIds)],
      type,
      weight,
      data: {},
    });
  }
}

export interface TimelineBranch {
  id: string;
  worldIds: string[];
  startYear: number;
  endYear: number;
  events: string[];
}
export interface TimelineMerge {
  id: string;
  fromBranches: string[];
  intoBranch: string;
  description: string;
}

export class TimelineV30Engine {
  private readonly branches = new Map<string, TimelineBranch>();
  private readonly merges = new Map<string, TimelineMerge>();

  createBranch(worldIds: string[], startYear: number): TimelineBranch {
    const branch = { id: `branch-${randomUUID()}`, worldIds: [...worldIds], startYear, endYear: startYear, events: [] };
    this.branches.set(branch.id, branch);
    return copyBranch(branch);
  }

  extendBranch(branchId: string, year: number, event: string): TimelineBranch | undefined {
    const branch = this.branches.get(branchId);
    if (!branch) return undefined;
    if (year < branch.endYear) throw new Error('Timeline years must be monotonic.');
    branch.endYear = year;
    branch.events.push(event);
    return copyBranch(branch);
  }

  mergeBranches(fromBranches: string[], intoBranch: string, description: string): TimelineMerge {
    const merge = { id: `merge-${randomUUID()}`, fromBranches: [...fromBranches], intoBranch, description };
    this.merges.set(merge.id, merge);
    return { ...merge, fromBranches: [...merge.fromBranches] };
  }

  listBranches(): TimelineBranch[] { return [...this.branches.values()].map(copyBranch); }
  listMerges(): TimelineMerge[] { return [...this.merges.values()].map((merge) => ({ ...merge, fromBranches: [...merge.fromBranches] })); }
}

export interface FieldVectorV30 {
  eid: string;
  meaningGradient: number;
  pressureGradient: number;
  continuityFlux: number;
}
export interface FieldSnapshotV30 { vectors: FieldVectorV30[]; summary: string }

export class ExistentialFieldV30Engine {
  constructor(private readonly worldGraph: WorldGraphEngine) {}

  computeField(): FieldSnapshotV30 {
    const vectors = this.worldGraph.listNodes().map((node) => ({
      eid: node.id,
      meaningGradient: node.meaningScore * (node.tags.includes('mythic') ? 1.2 : 1),
      pressureGradient: node.riskProfile * (node.continuityArc === 'collapsing' ? 1.3 : 1),
      continuityFlux:
        node.continuityArc === 'emerging' ? node.meaningScore * 0.8 : node.continuityArc === 'collapsing' ? -node.riskProfile * 0.9 : 0,
    }));
    return { vectors, summary: `Computed existential field for ${vectors.length} entities.` };
  }

  getHighPressureEntities(threshold = 0.8): string[] { return this.worldGraph.listNodes().filter((node) => node.riskProfile > threshold).map((node) => node.id); }
  getHighMeaningEntities(threshold = 0.8): string[] { return this.worldGraph.listNodes().filter((node) => node.meaningScore > threshold).map((node) => node.id); }
}

export interface OmniBridgeV30 {
  id: string;
  fromWorlds: string[];
  toWorlds: string[];
  branchId?: string;
  type: 'mythic' | 'causal' | 'symbolic' | 'collapse';
  strength: number;
  data: Record<string, unknown>;
}

export class OmniBridgeV30Engine {
  private readonly bridges = new Map<string, OmniBridgeV30>();

  constructor(private readonly hypergraph: HypergraphV30Engine) {}

  createBridge(fromWorlds: string[], toWorlds: string[], type: OmniBridgeV30['type'], strength: number, branch?: TimelineBranch): OmniBridgeV30 {
    const bridge = { id: `omnibridge-${randomUUID()}`, fromWorlds: [...fromWorlds], toWorlds: [...toWorlds], branchId: branch?.id, type, strength, data: {} };
    this.bridges.set(bridge.id, bridge);
    this.hypergraph.addHyperEdge({ id: `hyper-${bridge.id}`, nodes: [...fromWorlds, ...toWorlds], type: `omnibridge-${type}`, weight: strength, data: { bridgeId: bridge.id } });
    return copyBridge(bridge);
  }

  listBridges(): OmniBridgeV30[] { return [...this.bridges.values()].map(copyBridge); }
  getBridge(id: string): OmniBridgeV30 | undefined { const bridge = this.bridges.get(id); return bridge ? copyBridge(bridge) : undefined; }
  getBridgesForWorld(eid: string): OmniBridgeV30[] { return this.listBridges().filter((bridge) => bridge.fromWorlds.includes(eid) || bridge.toWorlds.includes(eid)); }
}

export type ContinuityStateV30 = 'stable' | 'collapsing' | 'emerging' | 'extinct' | 'mythic' | 'transcendent';
export interface SuperposedArcV30 { eid: string; amplitudes: Record<ContinuityStateV30, number> }
export interface CollapseResultV30 { eid: string; chosenArc: ContinuityStateV30; updatedContext: ExistentialContext }

export class QuantumContinuityV30Engine {
  constructor(private readonly worldGraph: WorldGraphEngine) {}

  superpose(eid: string): SuperposedArcV30 | undefined {
    const node = this.worldGraph.getNode(eid);
    if (!node) return undefined;
    const amplitudes: Record<ContinuityStateV30, number> = { stable: 0.3, collapsing: node.riskProfile * 0.4, emerging: node.meaningScore * 0.3, extinct: 0.05, mythic: node.tags.includes('mythic') ? 0.2 : 0.05, transcendent: node.tags.includes('transcendent') ? 0.2 : 0.05 };
    const total = Object.values(amplitudes).reduce((sum, value) => sum + value, 0);
    for (const state of Object.keys(amplitudes) as ContinuityStateV30[]) amplitudes[state] /= total;
    return { eid, amplitudes };
  }

  collapse(eid: string): CollapseResultV30 | undefined {
    const superposed = this.superpose(eid);
    const node = this.worldGraph.getNode(eid);
    if (!superposed || !node) return undefined;
    const chosenArc = (Object.entries(superposed.amplitudes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'stable') as ContinuityStateV30;
    const updatedContext = updateExistentialContext(node, { continuityArc: chosenArc, meaningScore: chosenArc === 'emerging' ? node.meaningScore * 1.1 : chosenArc === 'collapsing' ? node.meaningScore * 0.9 : node.meaningScore, riskProfile: chosenArc === 'collapsing' ? Math.min(1, node.riskProfile + 0.1) : chosenArc === 'emerging' ? Math.max(0, node.riskProfile - 0.05) : node.riskProfile });
    this.worldGraph.upsertNode({ ...node, ...updatedContext });
    return { eid, chosenArc, updatedContext };
  }
}

export interface SynthesizedTraceV30 { eid: string; traces: unknown[]; synthesis: unknown; metaSummary: string }
export class MetaLuchiiV30Engine {
  constructor(private readonly luchii: LuchiiRuntime, private readonly meta: MetaCognition) {}
  synthesize(eid: string, ctx: ExistentialContext, payloads: unknown[]): SynthesizedTraceV30 {
    const traces: unknown[] = [];
    const steps: unknown[] = [];
    for (const payload of payloads) {
      const result = this.luchii.analyze(eid, ctx, payload);
      traces.push(result.trace);
      steps.push({ summary: `Synthesis of trace ${result.trace.traceId}`, confidence: 1, tags: [] });
    }
    const synthesis = { traceId: `synth-${eid}-${randomUUID()}`, eid, steps, conclusion: 'Meta-Luchii synthesis of multiple existential analyses.' };
    const reflected = this.meta.reflect(eid, ctx, synthesis as never);
    return { eid, traces, synthesis, metaSummary: reflected.metaSummary };
  }
}

function copyCluster(cluster: WorldCluster): WorldCluster { return { ...cluster, nodeIds: [...cluster.nodeIds], tags: [...cluster.tags] }; }
function copyBranch(branch: TimelineBranch): TimelineBranch { return { ...branch, worldIds: [...branch.worldIds], events: [...branch.events] }; }
function copyBridge(bridge: OmniBridgeV30): OmniBridgeV30 { return { ...bridge, fromWorlds: [...bridge.fromWorlds], toWorlds: [...bridge.toWorlds], data: { ...bridge.data } }; }
