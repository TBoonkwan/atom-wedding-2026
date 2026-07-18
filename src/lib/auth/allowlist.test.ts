import { describe, expect, it } from 'vitest';
import { isAllowedHostEmail } from './allowlist';

describe('isAllowedHostEmail', () => {
  it('normalizes case and whitespace in a comma-separated allowlist', () => {
    expect(isAllowedHostEmail('HOST@example.com', ' owner@example.com, host@example.com ')).toBe(true);
    expect(isAllowedHostEmail('guest@example.com', 'owner@example.com')).toBe(false);
  });
});
