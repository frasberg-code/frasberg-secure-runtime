export * from './rate-limit';

export interface RateDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

// Fixed-window limiter keyed by caller (e.g. API key id).
export class RateLimiter {
  private readonly windows = new Map<
    string,
    { start: number; count: number }
  >();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateDecision {
    const t = this.now();
    let w = this.windows.get(key);
    if (!w || t - w.start >= this.windowMs) {
      w = { start: t, count: 0 };
      this.windows.set(key, w);
    }
    if (w.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: w.start + this.windowMs - t,
      };
    }
    w.count += 1;
    return { allowed: true, remaining: this.limit - w.count, retryAfterMs: 0 };
  }
}
