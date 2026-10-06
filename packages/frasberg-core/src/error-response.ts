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
  return (
    req.requestId ??
    (Array.isArray(header) ? header[0] : header) ??
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
