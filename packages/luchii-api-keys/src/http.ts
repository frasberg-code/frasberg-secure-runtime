import { randomBytes } from 'node:crypto';
import { buildError, isValidRequestId } from '@frasberg/core';

// Minimal Express-compatible shapes so the middleware needs no Express dependency.
export interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
  apiKey?: any;
  ownerId?: string;
  workspaceId?: string;
  requestId?: string;
}

export interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): unknown;
}

export type NextFunction = (err?: unknown) => void;

export const ERROR_STATUS = {
  KEY_NOT_PROVIDED: 401,
  KEY_NOT_FOUND: 401,
  OWNER_NOT_FOUND: 401,
  KEY_DISABLED: 403,
  ACCOUNT_SUSPENDED: 403,
  PERMISSION_DENIED: 403,
  MODEL_NOT_FOUND: 404,
  WORKSPACE_NOT_FOUND: 404,
  RATE_LIMIT_EXCEEDED: 429,
  QUOTA_EXCEEDED: 429,
  MODEL_UNAVAILABLE: 503,
  RUNTIME_UNAVAILABLE: 503,
  SERVICE_UNAVAILABLE: 503,
  AUTH_FAILURE: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export function requestIdOf(req: HttpRequest): string {
  const header = req.headers['x-request-id'];
  const id = Array.isArray(header) ? header[0] : header;
  req.requestId ??= (isValidRequestId(id) ? id : undefined) ?? `req_${randomBytes(6).toString('hex')}`;
  return req.requestId;
}

export function sendError(
  req: HttpRequest,
  res: HttpResponse,
  code: ErrorCode,
  message: string,
  extra: Record<string, unknown> = {},
) {
  const err = buildError(
    requestIdOf(req),
    ERROR_STATUS[code],
    code,
    message,
    extra,
  );
  return res.status(err.status).json(err.body);
}

export function sendSuccess(
  req: HttpRequest,
  res: HttpResponse,
  data: unknown,
) {
  return res.json({ success: true, requestId: requestIdOf(req), data });
}
