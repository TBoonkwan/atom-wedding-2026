import { describe, expect, it } from 'vitest';
import { invitationPath, invitationUrl } from './invitation-url';

describe('invitation URLs', () => {
  it('builds the canonical invitation path with an encoded token', () => {
    expect(invitationPath('abc 123')).toBe('/invitation/abc%20123');
  });

  it('builds an absolute invitation URL from the site origin', () => {
    expect(invitationUrl('https://example.com', 'secure-token'))
      .toBe('https://example.com/invitation/secure-token');
  });
});
