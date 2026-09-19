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

export interface RegisterWorldGraphWorldInput extends ExistentialContext {
  id?: string;
  label: string;
}

export interface WorldGraphWorld extends ExistentialContext {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorldGraphListOptions {
  clusterId?: string;
}

export class WorldGraphEngine {
  private readonly nodesByEid = new Map<string, WorldGraphNode>();
  private readonly worldsById = new Map<string, WorldGraphWorld>();

  registerWorld(input: RegisterWorldGraphWorldInput): WorldGraphWorld {
    const id =
      input.id === undefined
        ? randomUUID()
        : readNonEmptyString(input.id, 'id');
    if (this.worldsById.has(id)) {
      throw new Error(`World "${id}" already exists.`);
    }

    const now = new Date().toISOString();
    const world: WorldGraphWorld = {
      id,
      label: readNonEmptyString(input.label, 'label'),
      eid: readNonEmptyString(input.eid, 'eid'),
      existenceState: readNonEmptyString(
        input.existenceState,
        'existenceState',
      ),
      continuityArc: readNonEmptyString(input.continuityArc, 'continuityArc'),
      meaningScore: readUnitInterval(input.meaningScore, 'meaningScore'),
      riskProfile: readUnitInterval(input.riskProfile, 'riskProfile'),
      tags: readTags(input.tags),
      createdAt: now,
      updatedAt: now,
    };

    this.worldsById.set(id, world);
    return copyWorld(world);
  }

  removeWorld(id: string): WorldGraphWorld | undefined {
    const normalizedId = readNonEmptyString(id, 'id');
    const world = this.worldsById.get(normalizedId);
    if (!world) {
      return undefined;
    }

    this.worldsById.delete(normalizedId);
    for (const [eid, node] of this.nodesByEid.entries()) {
      if (node.clusterId === normalizedId) {
        this.nodesByEid.delete(eid);
      }
    }

    return copyWorld(world);
  }

  getWorld(id: string): WorldGraphWorld | undefined {
    const world = this.worldsById.get(readNonEmptyString(id, 'id'));
    return world ? copyWorld(world) : undefined;
  }

  hasWorld(id: string): boolean {
    return this.worldsById.has(readNonEmptyString(id, 'id'));
  }

  listWorlds(): WorldGraphWorld[] {
    return [...this.worldsById.values()]
      .slice()
      .sort((left, right) => left.label.localeCompare(right.label))
      .map(copyWorld);
  }

  upsertNode(input: UpsertWorldGraphNodeInput): WorldGraphNode {
    const now = new Date().toISOString();
    const clusterId = readNonEmptyString(input.clusterId, 'clusterId');
    const eid = readNonEmptyString(input.eid, 'eid');
    if (this.worldsById.size > 0 && !this.worldsById.has(clusterId)) {
      throw new Error(`World "${clusterId}" does not exist.`);
    }

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
      meaningScore: readUnitInterval(input.meaningScore, 'meaningScore'),
      riskProfile: readUnitInterval(input.riskProfile, 'riskProfile'),
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
    if (this.worldsById.size > 0) {
      return this.worldsById.size;
    }

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

function copyWorld(world: WorldGraphWorld): WorldGraphWorld {
  return {
    ...world,
    tags: [...world.tags],
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
