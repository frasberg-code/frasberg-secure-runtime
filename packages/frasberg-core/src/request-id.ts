import { randomBytes } from 'node:crypto';

interface Req {
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
}

interface Res {
  setHeader(name: string, value: string): unknown;
}

const SAFE_ID = /^[A-Za-z0-9_.-]{1,128}$/;

export function requestIdMiddleware(
  req: Req,
  res: Res,
  next: (err?: unknown) => void,
) {
  const header = req.headers['x-request-id'];
  const incoming = Array.isArray(header) ? header[0] : header;
  const id =
    incoming && SAFE_ID.test(incoming)
      ? incoming
      : `req_${randomBytes(8).toString('hex')}`;
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
