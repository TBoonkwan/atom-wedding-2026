import { describe, expect, it } from 'vitest';
import { DRAFTS, getDraft } from './draft-data';

describe('draft catalog', () => {
  it('exposes the three approved routes in comparison order', () => {
    expect(DRAFTS.map((draft) => draft.href)).toEqual([
      '/drafts/neon-editorial',
      '/drafts/pop-postcard',
      '/drafts/afterdark-ticket',
    ]);
  });

  it('resolves an approved draft by theme', () => {
    expect(getDraft('afterdark-ticket').title).toBe('Afterdark Ticket Club');
  });

  it('includes the approved teal accent in the Pop Postcard palette', () => {
    expect(getDraft('pop-postcard').palette).toContain('#087f78');
  });
});
