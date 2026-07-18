import { describe, expect, it } from 'vitest';
import { mergeCheckIn } from './checkin';

describe('mergeCheckIn', () => {
  it('updates an existing invitation instead of creating a duplicate', () => {
    const initial = [{ invitationId: 'i1', attendeeCount: 2, checkedInAt: 'first' }];

    const result = mergeCheckIn(initial, {
      invitationId: 'i1',
      attendeeCount: 3,
      checkedInAt: 'second',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      invitationId: 'i1',
      attendeeCount: 3,
      checkedInAt: 'second',
    });
  });
});
