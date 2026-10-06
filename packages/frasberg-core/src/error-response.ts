import type { ErrorPayload } from './error-types';
import { isValidRequestId } from './request-id';

export interface BuiltError {
  status: number;
  body: {
    success: false;
    requestId: string;
    error: { code: string; message: string; [extra: string]: unknown };
  };
}

// One payload shape for every middleware error.
export function buildError(
  requestId: string,
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
): BuiltError {
  return {
    status,
    body: {
      success: false,
      requestId,
      error: { code, message, ...extra },
    },
  };
}

export function requestIdFrom(req: {
  requestId?: string;
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const header = req.headers?.['x-request-id'];
  const incoming = Array.isArray(header) ? header[0] : header;
  return (
    req.requestId ??
    (isValidRequestId(incoming) ? incoming : undefined) ??
    'req_unknown'
  );
}

interface ResLike {
  status(code: number): ResLike;
  json(body: unknown): unknown;
}

export function sendBuiltError(
  req: {
    requestId?: string;
    headers?: Record<string, string | string[] | undefined>;
  },
  res: ResLike,
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
) {
  const err = buildError(requestIdFrom(req), status, code, message, extra);
  return res.status(err.status).json(err.body);
}

// `details` is omitted entirely when undefined.
export function buildErrorResponse(
  requestId: string,
  code: string,
  message: string,
  details?: unknown,
): ErrorPayload {
  return {
    success: false,
    requestId,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}
