import { describe, expect, it } from 'vitest';
import { FixedWindowRateLimiter } from './rate-limit';

describe('FixedWindowRateLimiter', () => {
  it('blocks writes after the configured limit and resets after the window', () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000);

    expect(limiter.consume('guest', 0).allowed).toBe(true);
    expect(limiter.consume('guest', 10).allowed).toBe(true);
    expect(limiter.consume('guest', 20).allowed).toBe(false);
    expect(limiter.consume('guest', 1_001).allowed).toBe(true);
  });
});
