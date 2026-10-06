interface Req {
  headers?: Record<string, string | string[] | undefined>;
  ownerId?: string;
  requestId?: string;
}

interface Res {
  status(code: number): Res;
  json(body: unknown): unknown;
}

function fail(
  req: Req,
  res: Res,
  status: number,
  code: string,
  message: string,
) {
  const header = req.headers?.['x-request-id'];
  const requestId =
    req.requestId ??
    (Array.isArray(header) ? header[0] : header) ??
    'req_unknown';
  return res
    .status(status)
    .json({ success: false, requestId, error: { code, message } });
}

export function rateLimit(
  limit = 1000,
  windowMs = 60_000,
  now: () => number = Date.now,
) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return (req: Req, res: Res, next: (err?: unknown) => void) => {
    const ownerId = req.ownerId;
    if (!ownerId)
      return fail(req, res, 401, 'OWNER_NOT_FOUND', 'Owner not resolved.');

    const t = now();
    let bucket = buckets.get(ownerId);
    if (!bucket || bucket.resetAt <= t) {
      bucket = { count: 0, resetAt: t + windowMs };
      buckets.set(ownerId, bucket);
    }

    bucket.count++;
    if (bucket.count > limit) {
      return fail(req, res, 429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded.');
    }
    return next();
  };
}
