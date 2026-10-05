// server/rateLimiter.js — DDoS protection & per-IP rate limiting
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
await redis.connect();

const LIMITS = {
  global:    { max: 100, window: 60 },   // 100 requests/min per IP
  ws:        { max: 20,  window: 10 },   // 20 WS connects/10s per IP
  auth:      { max: 5,   window: 30 },   // 5 auth attempts/30s per IP
};

export async function rateLimitIP(ip, type = 'global') {
  const { max, window: win } = LIMITS[type] || LIMITS.global;
  const key = `rl:${type}:${ip}`;
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, win);
  if (current > max) {
    return {
      allowed: false,
      retryAfter: await redis.ttl(key),
      limit: max,
      current,
    };
  }
  return { allowed: true, current, limit: max };
}

export function rateLimitMiddleware(type = 'global') {
  return async (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const result = await rateLimitIP(ip, type);
    res.setHeader('X-RateLimit-Limit',     result.limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, result.limit - result.current));
    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({
        error:      'Too Many Requests',
        retryAfter: result.retryAfter,
        message:    'Slow down — rate limit exceeded.',
      });
    }
    next();
  };
}

export async function wsRateLimit(ip) {
  return rateLimitIP(ip, 'ws');
}
