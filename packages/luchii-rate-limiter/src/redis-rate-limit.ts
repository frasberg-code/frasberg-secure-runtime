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

export interface RateLimitOptions {
  failClosed?: boolean;
  timeoutMs?: number;
}

// Fixed window per owner. If Redis fails or times out the request is allowed
// (fail-open) unless failClosed is set, which returns 503.
export function redisRateLimit(
  limit = 1000,
  windowSeconds = 60,
  options: RateLimitOptions = {},
) {
  const timeoutMs = options.timeoutMs ?? 1000;
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
    } catch (error) {
      if (options.failClosed) {
        return sendBuiltError(
          req,
          res,
          503,
          'RATE_LIMIT_SERVICE_UNAVAILABLE',
          'Rate limiting service unavailable.',
        );
      }
      console.error('Rate limiter unavailable', error);
      return next();
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
