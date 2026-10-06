import type { HttpRequest, HttpResponse, NextFunction } from './http';
import { sendError } from './http';
import { getApiKeyByHash } from './api-key-store';
import { hashApiKey } from './generate-key';

export function extractKey(req: HttpRequest): string | undefined {
  const raw = req.headers['x-api-key'] ?? req.headers['authorization'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const key = value?.replace(/^Bearer\s+/i, '').trim();
  return key || undefined;
}

// 401 only when the key is missing or its hash does not exist.
export async function apiKeyMiddleware(
  req: HttpRequest,
  res: HttpResponse,
  next: NextFunction,
) {
  try {
    const key = extractKey(req);
    if (!key)
      return sendError(req, res, 'KEY_NOT_PROVIDED', 'API key is required.');

    const record = await getApiKeyByHash(hashApiKey(key));
    if (!record)
      return sendError(req, res, 'KEY_NOT_FOUND', 'API key was not found.');

    if (record.status === 'suspended') {
      return sendError(req, res, 'ACCOUNT_SUSPENDED', 'Account is suspended.');
    }
    if (record.status !== 'active') {
      return sendError(req, res, 'KEY_DISABLED', 'API key is disabled.');
    }

    req.apiKey = record;
    req.ownerId = record.ownerId;
    req.workspaceId = record.workspaceId;
    return next();
  } catch {
    return sendError(req, res, 'AUTH_FAILURE', 'Failed to validate API key.');
  }
}
