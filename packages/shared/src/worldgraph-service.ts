import {
  type FullGameStackSchema,
  type WorldGraphCreateInput,
  type WorldGraphRecord,
  createWorldGraphRecord,
} from './full-game-stack-schema';

export interface WorldGraphService {
  createWorld(input: WorldGraphCreateInput): WorldGraphRecord;
  getWorld(id: string): WorldGraphRecord | undefined;
  listWorlds(): WorldGraphRecord[];
  updateWorld(
    id: string,
    updates: Partial<WorldGraphCreateInput>,
  ): WorldGraphRecord;
  deleteWorld(id: string): WorldGraphRecord | undefined;
  materializeScene(worldId: string): {
    worldId: string;
    rootId: string;
    nodes: WorldGraphRecord['nodes'];
    materializedAt: string;
  };
  toSchema(
    worldId: string,
    input?: Partial<FullGameStackSchema>,
  ): FullGameStackSchema;
}

export class InMemoryWorldGraphService implements WorldGraphService {
  private readonly worlds = new Map<string, WorldGraphRecord>();

  createWorld(input: WorldGraphCreateInput): WorldGraphRecord {
    const world = createWorldGraphRecord(input);
    this.worlds.set(world.id, world);
    return cloneWorld(world);
  }

  getWorld(id: string): WorldGraphRecord | undefined {
    const world = this.worlds.get(id);
    return world ? cloneWorld(world) : undefined;
  }

  listWorlds(): WorldGraphRecord[] {
    return [...this.worlds.values()].map(cloneWorld);
  }

  updateWorld(
    id: string,
    updates: Partial<WorldGraphCreateInput>,
  ): WorldGraphRecord {
    const current = this.worlds.get(id);
    if (!current) {
      throw new Error(`World "${id}" does not exist.`);
    }

    const updated: WorldGraphRecord = {
      ...current,
      ...{
        name: updates.name ?? current.name,
        kind: updates.kind ?? current.kind,
        ownerId: updates.ownerId ?? current.ownerId,
        status: updates.status ?? current.status,
        schemaVersion: updates.schemaVersion ?? current.schemaVersion,
        nodes: updates.nodes ? [...updates.nodes] : [...current.nodes],
        metadata: updates.metadata
          ? { ...current.metadata, ...updates.metadata }
          : { ...current.metadata },
      },
      updatedAt: new Date().toISOString(),
    };

    this.worlds.set(id, updated);
    return cloneWorld(updated);
  }

  deleteWorld(id: string): WorldGraphRecord | undefined {
    const existing = this.worlds.get(id);
    if (!existing) {
      return undefined;
    }
    this.worlds.delete(id);
    return cloneWorld(existing);
  }

  materializeScene(worldId: string) {
    const world = this.getWorld(worldId);
    if (!world) {
      throw new Error(`World "${worldId}" does not exist.`);
    }
    const sorted = [...world.nodes].sort((left, right) =>
      left.label.localeCompare(right.label),
    );
    return {
      worldId: world.id,
      rootId: sorted[0]?.id ?? world.id,
      nodes: sorted,
      materializedAt: new Date().toISOString(),
    };
  }

  toSchema(
    worldId: string,
    input: Partial<FullGameStackSchema> = {},
  ): FullGameStackSchema {
    const world = this.getWorld(worldId);
    if (!world) {
      throw new Error(`World "${worldId}" does not exist.`);
    }

    const now = new Date().toISOString();
    return {
      id: input.id ?? `schema-${world.id}`,
      name: input.name ?? world.name,
      description: input.description ?? 'Generated from WorldGraph definition',
      ownerId: input.ownerId ?? world.ownerId,
      surfaces: input.surfaces ?? ['game', 'website'],
      world,
      version: input.version ?? 1,
      metadata: input.metadata ?? {},
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    };
  }
}

function cloneWorld(world: WorldGraphRecord): WorldGraphRecord {
  return {
    ...world,
    nodes: world.nodes.map((node) => ({
      ...node,
      tags: [...node.tags],
      config: { ...node.config },
    })),
    metadata: { ...world.metadata },
  };
}
