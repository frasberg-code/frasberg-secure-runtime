export type Permission =
  | 'chat'
  | 'jobs:read'
  | 'jobs:write'
  | 'media'
  | 'audio'
  | 'video'
  | 'stt'
  | 'tts'
  | 'governance:admin'
  | 'botbase:read'
  | 'botbase:write';

export interface ApiKeyRecord {
  id: string;
  secret: string;
  permissions: Permission[];
  tenants?: string[];
}

export interface AuthContext {
  authenticated: boolean;
  keyId?: string;
  permissions: Permission[];
  tenantId?: string;
  userId?: string;
}

export interface AuthErrorPayload {
  error: {
    code: 'FK-001' | 'FK-003';
    message: string;
  };
}

const INVALID_KEY: AuthErrorPayload = {
  error: {
    code: 'FK-001',
    message: 'Invalid or missing API key.',
  },
};

const MISSING_PERMISSION: AuthErrorPayload = {
  error: {
    code: 'FK-003',
    message: 'Authenticated principal is missing the required permission.',
  },
};

export function invalidKeyResponse(): AuthErrorPayload {
  return INVALID_KEY;
}

export function missingPermissionResponse(): AuthErrorPayload {
  return MISSING_PERMISSION;
}

export function parseApiKeys(raw: string | undefined): ApiKeyRecord[] {
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as ApiKeyRecord[];
  return parsed.filter((record) => record.id && record.secret);
}

export function authenticateRequest(
  headers: Record<string, string | string[] | undefined>,
  apiKeys: ApiKeyRecord[],
): { context?: AuthContext; error?: AuthErrorPayload } {
  const rawAuthorization = normalizeHeader(headers.authorization);
  const rawApiKey = normalizeHeader(headers['x-api-key']);
  const bearer = rawAuthorization?.startsWith('Bearer ')
    ? rawAuthorization.slice('Bearer '.length).trim()
    : undefined;
  const presentedSecret = rawApiKey ?? bearer;

  if (!presentedSecret) {
    return { error: invalidKeyResponse() };
  }

  const matchingKey = apiKeys.find(
    (candidate) => candidate.secret === presentedSecret,
  );
  if (!matchingKey) {
    return { error: invalidKeyResponse() };
  }

  const requestedTenant = normalizeHeader(headers['x-tenant-id']);
  if (
    (requestedTenant !== undefined &&
      !matchingKey.tenants?.includes(requestedTenant)) ||
    (Array.isArray(headers['x-tenant-id']) &&
      headers['x-tenant-id'].length !== 1)
  ) {
    return { error: invalidKeyResponse() };
  }

  return {
    context: {
      authenticated: true,
      keyId: matchingKey.id,
      permissions: matchingKey.permissions,
      tenantId: requestedTenant ?? matchingKey.tenants?.[0],
    },
  };
}

export function hasPermission(
  context: AuthContext | undefined,
  permission: Permission,
): boolean {
  return Boolean(context?.permissions.includes(permission));
}

function normalizeHeader(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
