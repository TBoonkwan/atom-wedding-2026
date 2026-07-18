import { describe, expect, it } from 'vitest';
import { trustedClientKey } from './client-key';

describe('trustedClientKey', () => {
  it('trusts only Vercel-owned forwarded IP headers in production', () => {
    const request = new Request('https://wedding.example', {
      headers: {
        'x-forwarded-for': 'spoofed',
        'x-vercel-forwarded-for': '203.0.113.7, 10.0.0.1',
      },
    });
    expect(trustedClientKey(request, { VERCEL: '1' })).toBe('203.0.113.7');
    expect(trustedClientKey(request, {})).toBe('local');
  });
});
