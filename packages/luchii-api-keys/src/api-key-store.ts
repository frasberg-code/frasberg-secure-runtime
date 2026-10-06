import type { ApiKey } from './api-key';
import { generateApiKey } from './generate-key';

export interface ApiKeyStore {
  findByHash(hash: string): Promise<ApiKey | undefined>;
  save(key: ApiKey): Promise<void>;
  list(workspaceId: string): Promise<ApiKey[]>;
}

export class InMemoryApiKeyStore implements ApiKeyStore {
  private readonly keys = new Map<string, ApiKey>();

  async findByHash(hash: string) {
    return this.keys.get(hash);
  }

  async save(key: ApiKey) {
    this.keys.set(key.hash, key);
  }

  async list(workspaceId: string) {
    return [...this.keys.values()].filter((k) => k.workspaceId === workspaceId);
  }
}

let activeStore: ApiKeyStore = new InMemoryApiKeyStore();

export function configureApiKeyStore(store: ApiKeyStore) {
  activeStore = store;
}

export function getApiKeyByHash(hash: string) {
  return activeStore.findByHash(hash);
}

export async function createApiKey(
  input: {
    ownerId: string;
    workspaceId: string;
    name: string;
    permissions: string[];
  },
  store: ApiKeyStore = activeStore,
): Promise<{ raw: string; key: ApiKey }> {
  const { raw, hash, prefix } = generateApiKey();
  const key: ApiKey = {
    id: `key_${hash.slice(0, 12)}`,
    ownerId: input.ownerId,
    workspaceId: input.workspaceId,
    name: input.name,
    prefix,
    hash,
    status: 'active',
    permissions: input.permissions,
    requestsToday: 0,
    createdAt: Date.now(),
  };
  await store.save(key);
  return { raw, key };
}
