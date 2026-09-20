import { randomUUID } from 'node:crypto';
import {
  EXISTENTIAL_SCORE_MAX,
  EXISTENTIAL_SCORE_MIN,
  ExistentialContext,
} from './wiring';

export interface WorldGraphNode extends ExistentialContext {
  id: string;
  nodeId: string;
  clusterId: string;
  updatedAt: string;
}

export interface UpsertWorldGraphNodeInput extends ExistentialContext {
  id?: string;
  clusterId: string;
}

// Backward-compatibility aliases for the older world-oriented API that the
// existential layer still references.
export type WorldGraphWorld = WorldGraphNode;
export type RegisterWorldGraphWorldInput = UpsertWorldGraphNodeInput;

export interface WorldGraphListOptions {
  clusterId?: string;
}

export class WorldGraphEngine {
  private readonly nodesByEid = new Map<string, WorldGraphNode>();

  upsertNode(input: UpsertWorldGraphNodeInput): WorldGraphNode {
    const now = new Date().toISOString();
    const clusterId = readNonEmptyString(input.clusterId, 'clusterId');
    const eid = readNonEmptyString(input.eid, 'eid');
    const id = readNonEmptyString(input.id ?? eid, 'id');

    const existing = this.nodesByEid.get(eid);
    const node: WorldGraphNode = {
      id,
      nodeId: existing?.nodeId ?? randomUUID(),
      clusterId,
      eid,
      existenceState: readNonEmptyString(
        input.existenceState,
        'existenceState',
      ),
      continuityArc: readNonEmptyString(input.continuityArc, 'continuityArc'),
      meaningScore: clampUnitInterval(input.meaningScore),
      riskProfile: clampUnitInterval(input.riskProfile),
      tags: readTags(input.tags),
      updatedAt: now,
    };

    this.nodesByEid.set(eid, node);
    return copyNode(node);
  }

  registerWorld(input: RegisterWorldGraphWorldInput): WorldGraphWorld {
    return this.upsertNode(input);
  }

  getNode(eid: string): WorldGraphNode | undefined {
    const normalized = readNonEmptyString(eid, 'eid');
    const node = this.nodesByEid.get(normalized);
    return node ? copyNode(node) : undefined;
  }

  getWorld(eid: string): WorldGraphWorld | undefined {
    return this.getNode(eid);
  }

  removeNode(eid: string): WorldGraphNode | undefined {
    const normalized = readNonEmptyString(eid, 'eid');
    const existing = this.nodesByEid.get(normalized);
    if (!existing) {
      return undefined;
    }
    this.nodesByEid.delete(normalized);
    return copyNode(existing);
  }

  removeWorld(eid: string): WorldGraphWorld | undefined {
    return this.removeNode(eid);
  }

  listNodes(options: WorldGraphListOptions = {}): WorldGraphNode[] {
    const clusterFilter =
      options.clusterId === undefined
        ? undefined
        : readNonEmptyString(options.clusterId, 'clusterId');
    const nodes = [...this.nodesByEid.values()].filter(
      (node) => !clusterFilter || node.clusterId === clusterFilter,
    );
    return nodes
      .slice()
      .sort((left, right) => left.eid.localeCompare(right.eid))
      .map(copyNode);
  }

  listWorlds(options: WorldGraphListOptions = {}): WorldGraphWorld[] {
    return this.listNodes(options);
  }

  getWorldCount(): number {
    return new Set([...this.nodesByEid.values()].map((node) => node.clusterId))
      .size;
  }
}

function copyNode(node: WorldGraphNode): WorldGraphNode {
  return {
    ...node,
    tags: [...node.tags],
  };
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function readTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error('tags must be an array.');
  }

  return value.map((entry, index) =>
    readNonEmptyString(entry, `tags[${index}]`),
  );
}

function clampUnitInterval(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Score values must be finite numbers.');
  }

  if (value < EXISTENTIAL_SCORE_MIN) {
    return EXISTENTIAL_SCORE_MIN;
  }

  if (value > EXISTENTIAL_SCORE_MAX) {
    return EXISTENTIAL_SCORE_MAX;
  }

  return value;
}
