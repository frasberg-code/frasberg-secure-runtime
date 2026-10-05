import crypto from 'crypto';
import {
  type FullGameStackSchema,
  type SceneGraphSnapshot,
  type WorldGraphCreateInput,
  type WorldGraphNodeSpec,
  type WorldGraphRecord,
  type WorldGraphService,
} from '@frasberg/shared';

export interface PlatformWorldGraphOptions {
  baseUrl?: string;
  apiKey?: string;
  signRequests?: boolean;
  fetchImpl?: typeof fetch;
}

const PLATFORM_KINDS = new Set(['game', 'app', 'site']);

/**
 * WorldGraphService backed by the live Frasberg platform /api/v1/worldgraph endpoints.
 * The external gateway/runtime-router and the platform share ONE persistent state
 * (MongoDB on the platform side), with continuity, diagnostics, policy and audit
 * applied by the platform on every mutation.
 */
export class PlatformWorldGraphService implements WorldGraphService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly sign: boolean;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PlatformWorldGraphOptions = {}) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.FRASBERG_PLATFORM_URL ??
      ''
    ).replace(/\/$/, '');
    this.apiKey = options.apiKey ?? process.env.FRASBERG_PLATFORM_API_KEY ?? '';
    this.sign =
      options.signRequests ?? process.env.FRASBERG_SIGN_REQUESTS === 'true';
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (!this.baseUrl) {
      throw new Error(
        'FRASBERG_PLATFORM_URL is required for PlatformWorldGraphService.',
      );
    }
    if (!this.apiKey) {
      throw new Error(
        'FRASBERG_PLATFORM_API_KEY is required for PlatformWorldGraphService.',
      );
    }
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<any | undefined> {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (this.sign && payload !== undefined) {
      headers['x-api-signature'] = crypto
        .createHmac('sha256', this.apiKey)
        .update(payload)
        .digest('hex');
    }
    const response = await this.fetchImpl(`${this.baseUrl}/api${path}`, {
      method,
      headers,
      body: payload,
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Platform WorldGraph ${method} ${path} failed: ${response.status} ${text}`,
      );
    }
    return response.json();
  }

  private toRecord(doc: any, owner: string): WorldGraphRecord {
    const world = doc.world ?? {};
    const metadata = world.metadata ?? {};
    return {
      id: world.id,
      name: world.name,
      kind: metadata.routerKind ?? world.kind,
      ownerId: owner,
      status: world.status ?? doc.status ?? 'active',
      schemaVersion: metadata.schemaVersion ?? '1.0.0',
      nodes: (world.nodes ?? []) as WorldGraphNodeSpec[],
      metadata,
      createdAt: new Date(doc.created_at ?? Date.now()).toISOString(),
      updatedAt: new Date(doc.updated_at ?? Date.now()).toISOString(),
    };
  }

  async createWorld(input: WorldGraphCreateInput): Promise<WorldGraphRecord> {
    const kind = input.kind ?? 'world';
    const body = {
      id: input.id ?? crypto.randomUUID(),
      name: input.name,
      kind: PLATFORM_KINDS.has(kind) ? kind : 'game',
      status: input.status ?? 'draft',
      metadata: {
        schemaVersion: input.schemaVersion ?? '1.0.0',
        tags: [],
        routerKind: kind,
        ...(input.metadata ?? {}),
      },
      nodes: input.nodes ?? [],
      scenes: [],
      pages: [],
      screens: [],
      flows: [],
      routes: [],
      vehicleClasses: [],
    };
    const envelope = await this.request('POST', '/v1/worldgraph', body);
    return this.toRecord(envelope.payload.record, envelope.owner);
  }

  async getWorld(id: string): Promise<WorldGraphRecord | undefined> {
    const envelope = await this.request(
      'GET',
      `/v1/worldgraph/${encodeURIComponent(id)}`,
    );
    if (!envelope) return undefined;
    return this.toRecord(envelope.payload.record, envelope.owner);
  }

  async listWorlds(): Promise<WorldGraphRecord[]> {
    const envelope = await this.request('GET', '/v1/worldgraph');
    return (envelope.payload.worlds as any[]).map((doc) =>
      this.toRecord(doc, envelope.owner),
    );
  }

  async updateWorld(
    id: string,
    updates: Partial<WorldGraphCreateInput>,
  ): Promise<WorldGraphRecord> {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.nodes !== undefined) patch.nodes = updates.nodes;
    if (
      updates.kind !== undefined ||
      updates.schemaVersion !== undefined ||
      updates.metadata !== undefined
    ) {
      const current = await this.getWorld(id);
      if (!current) throw new Error(`World "${id}" does not exist.`);
      const kind = updates.kind ?? current.kind;
      if (updates.kind !== undefined && PLATFORM_KINDS.has(kind)) {
        patch.kind = kind;
      }
      patch.metadata = {
        ...current.metadata,
        ...(updates.metadata ?? {}),
        schemaVersion: updates.schemaVersion ?? current.schemaVersion,
        routerKind: kind,
      };
    }
    const envelope = await this.request(
      'PATCH',
      `/v1/worldgraph/${encodeURIComponent(id)}`,
      patch,
    );
    if (!envelope) throw new Error(`World "${id}" does not exist.`);
    return this.toRecord(envelope.payload.record, envelope.owner);
  }

  async deleteWorld(id: string): Promise<WorldGraphRecord | undefined> {
    const envelope = await this.request(
      'DELETE',
      `/v1/worldgraph/${encodeURIComponent(id)}`,
    );
    if (!envelope) return undefined;
    return this.toRecord(envelope.payload.deleted, envelope.owner);
  }

  async materializeScene(worldId: string): Promise<SceneGraphSnapshot> {
    const envelope = await this.request(
      'GET',
      `/v1/worldgraph/${encodeURIComponent(worldId)}/materialize`,
    );
    if (!envelope) throw new Error(`World "${worldId}" does not exist.`);
    const payload = envelope.payload;
    return {
      worldId: payload.worldId,
      rootId: payload.rootId,
      nodes: (payload.nodes ?? []) as WorldGraphNodeSpec[],
      materializedAt: new Date(payload.materializedAt).toISOString(),
    };
  }

  async toSchema(
    worldId: string,
    input: Partial<FullGameStackSchema> = {},
  ): Promise<FullGameStackSchema> {
    const world = await this.getWorld(worldId);
    if (!world) throw new Error(`World "${worldId}" does not exist.`);
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
