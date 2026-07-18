interface RateLimitEntry {
  count: number;
  windowStartedAt: number;
}

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string, now = Date.now()) {
    const current = this.entries.get(key);
    if (!current || now - current.windowStartedAt >= this.windowMs) {
      this.entries.set(key, { count: 1, windowStartedAt: now });
      return { allowed: true, remaining: this.limit - 1 };
    }

    if (current.count >= this.limit) return { allowed: false, remaining: 0 };
    current.count += 1;
    return { allowed: true, remaining: this.limit - current.count };
  }
}
