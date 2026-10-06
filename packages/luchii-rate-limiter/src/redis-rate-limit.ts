import { sendBuiltError } from '@frasberg/core';
import { redis } from './redis-client';

interface Req {
  headers?: Record<string, string | string[] | undefined>;
  ownerId?: string;
  requestId?: string;
}

interface Res {
  status(code: number): Res;
  json(body: unknown): unknown;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('redis timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Fixed window per owner. Any Redis failure or timeout is 500 RATE_LIMIT_FAILURE.
export function redisRateLimit(
  limit = 1000,
  windowSeconds = 60,
  timeoutMs = 1000,
) {
  return async (req: Req, res: Res, next: (err?: unknown) => void) => {
    const ownerId = req.ownerId;
    if (!ownerId) {
      return sendBuiltError(
        req,
        res,
        401,
        'OWNER_NOT_FOUND',
        'Owner not resolved.',
      );
    }

    let count: number;
    try {
      const window = Math.floor(Date.now() / (windowSeconds * 1000));
      const key = `rl:${ownerId}:${window}`;
      count = await withTimeout(redis.incr(key), timeoutMs);
      if (count === 1)
        await withTimeout(redis.expire(key, windowSeconds), timeoutMs);
    } catch {
      return sendBuiltError(
        req,
        res,
        500,
        'RATE_LIMIT_FAILURE',
        'Rate limiter failed.',
      );
    }

    if (count > limit) {
      return sendBuiltError(
        req,
        res,
        429,
        'RATE_LIMIT_EXCEEDED',
        'Rate limit exceeded.',
      );
    }
    return next();
  };
}
