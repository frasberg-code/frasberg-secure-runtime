import { randomUUID } from 'node:crypto';

interface Req {
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
}

interface Res {
  setHeader(name: string, value: string): unknown;
}

const REQUEST_ID_REGEX = /^req_[a-zA-Z0-9_-]{8,128}$/;

export function isValidRequestId(value: unknown): value is string {
  return typeof value === 'string' && REQUEST_ID_REGEX.test(value);
}

export function requestIdMiddleware(
  req: Req,
  res: Res,
  next: (err?: unknown) => void,
) {
  const header = req.headers['x-request-id'];
  const incoming = Array.isArray(header) ? header[0] : header;
  const id =
    isValidRequestId(incoming)
      ? incoming
      : `req_${randomUUID()}`;
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
