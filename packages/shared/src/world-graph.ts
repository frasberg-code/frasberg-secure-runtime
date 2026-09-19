import { randomUUID } from 'node:crypto';
import {
  EXISTENTIAL_SCORE_MAX,
  EXISTENTIAL_SCORE_MIN,
  ExistentialContext,
} from './wiring';

export interface WorldGraphNode extends ExistentialContext {
  nodeId: string;
  clusterId: string;
  updatedAt: string;
}

export interface UpsertWorldGraphNodeInput extends ExistentialContext {
  clusterId: string;
}

export interface WorldGraphListOptions {
  clusterId?: string;
}

export class WorldGraphEngine {
  private readonly nodesByEid = new Map<string, WorldGraphNode>();

  upsertNode(input: UpsertWorldGraphNodeInput): WorldGraphNode {
    const now = new Date().toISOString();
    const clusterId = readNonEmptyString(input.clusterId, 'clusterId');
    const eid = readNonEmptyString(input.eid, 'eid');

    const existing = this.nodesByEid.get(eid);
    const node: WorldGraphNode = {
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

  getNode(eid: string): WorldGraphNode | undefined {
    const normalized = readNonEmptyString(eid, 'eid');
    const node = this.nodesByEid.get(normalized);
    return node ? copyNode(node) : undefined;
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
