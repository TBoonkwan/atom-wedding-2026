import { describe, expect, it } from 'vitest';
import { isPreviewAuthorized } from './preview';

describe('isPreviewAuthorized', () => {
  it('allows previews when no deployment password is configured', () => {
    expect(isPreviewAuthorized(null, undefined)).toBe(true);
  });

  it('checks a Basic authorization password', () => {
    const header = `Basic ${Buffer.from('preview:secret').toString('base64')}`;
    expect(isPreviewAuthorized(header, 'secret')).toBe(true);
    expect(isPreviewAuthorized(header, 'wrong')).toBe(false);
  });
});
