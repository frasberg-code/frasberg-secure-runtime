import { describe, expect, it, vi } from 'vitest';
import {
  PersistentWorldGraphService,
  SupabaseRestRpcClientFactory,
  type WorldGraphRpcClientFactory,
} from '../src';
import {
  FULL_GAME_STACK_SCHEMA_VERSION,
  type WorldDefinition,
} from '@frasberg/full-game-stack-schema';

describe('PersistentWorldGraphService', () => {
  it('creates validated definitions through the configured RPC', async () => {
    const rpc = vi.fn(async (_name: string, args?: Record<string, unknown>) =>
      toRow(args?.p_definition as WorldDefinition),
    );
    const service = new PersistentWorldGraphService(factoryWithRpc(rpc));

    const record = await service.createDefinition(
      context(),
      baseWorldDefinition(),
    );

    expect(record.kind).toBe('game');
    expect(record.ownerId).toBe('owner-1');
    expect(rpc).toHaveBeenCalledWith('rpc_create_worldgraph_definition', {
      p_definition: baseWorldDefinition(),
    });
  });

  it('normalizes paginated list responses', async () => {
    const rpc = vi.fn(async () => [toListRow(baseWorldDefinition(), 1)]);
    const service = new PersistentWorldGraphService(factoryWithRpc(rpc));

    const page = await service.listDefinitions(context(), {
      page: 2,
      pageSize: 10,
    });

    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(10);
    expect(page.total).toBe(1);
    expect(rpc).toHaveBeenCalledWith('rpc_list_worldgraph_definitions', {
      p_limit: 10,
      p_offset: 10,
    });
  });

  it('rejects unexpected owner data from the RPC layer', async () => {
    const rpc = vi.fn(async () => ({
      ...toRow(baseWorldDefinition()),
      owner_id: 'other-owner',
    }));
    const service = new PersistentWorldGraphService(factoryWithRpc(rpc));

    await expect(service.getDefinition(context(), 'world-1')).rejects.toThrow(
      /unexpected owner/i,
    );
  });

  it('returns undefined when get and update RPCs return null', async () => {
    const rpc = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const service = new PersistentWorldGraphService(factoryWithRpc(rpc));

    await expect(service.getDefinition(context(), 'missing')).resolves.toBe(
      undefined,
    );
    await expect(
      service.updateDefinition(context(), 'missing', baseWorldDefinition()),
    ).resolves.toBe(undefined);
  });
});

describe('SupabaseRestRpcClientFactory', () => {
  it('sends authenticated JSON RPC requests', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const factory = new SupabaseRestRpcClientFactory({
      baseUrl: 'https://example.supabase.co',
      apiKey: 'anon-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await factory
      .create('jwt-token')
      .rpc<{ ok: boolean }>('rpc_ping', { ping: 'pong' });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/rpc/rpc_ping',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: 'anon-key',
          authorization: expect.any(String),
          'content-type': 'application/json',
        }),
        body: JSON.stringify({ ping: 'pong' }),
      }),
    );
  });
});

function factoryWithRpc(
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<unknown>,
): WorldGraphRpcClientFactory {
  return {
    create() {
      return {
        rpc,
      };
    },
  };
}

function context() {
  return { accessToken: 'jwt-token', ownerId: 'owner-1' };
}

function baseWorldDefinition(): WorldDefinition {
  return {
    id: 'world-1',
    name: 'GT Demo',
    kind: 'game',
    metadata: {
      schemaVersion: FULL_GAME_STACK_SCHEMA_VERSION,
      tags: ['phase-1'],
    },
    scenes: [],
    pages: [],
    screens: [],
    flows: [],
    routes: [],
    vehicleClasses: [],
  };
}

function toRow(definition: WorldDefinition) {
  return {
    id: 'world-1',
    owner_id: 'owner-1',
    definition_kind: definition.kind,
    name: definition.name,
    schema_version: definition.metadata.schemaVersion,
    document: definition,
    created_at: '2026-09-19T13:00:00.000Z',
    updated_at: '2026-09-19T13:00:00.000Z',
  };
}

function toListRow(definition: WorldDefinition, totalCount: number) {
  return {
    ...toRow(definition),
    total_count: totalCount,
  };
}
