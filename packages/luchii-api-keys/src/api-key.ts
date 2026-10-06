export type ApiKeyStatus = 'active' | 'disabled' | 'suspended';

export interface ApiKey {
  id: string;
  ownerId: string;
  workspaceId: string;
  name: string;
  prefix?: string;
  hash: string;
  status: ApiKeyStatus;
  permissions: string[];
  requestsToday: number;
  createdAt: number;
}
