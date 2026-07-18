import { describe, expect, it } from 'vitest';
import { getCountdownParts } from './countdown';

describe('getCountdownParts', () => {
  it('splits the remaining duration into days, hours, minutes, and seconds', () => {
    expect(
      getCountdownParts(
        new Date('2026-12-01T08:00:00.000Z'),
        new Date('2026-12-04T08:01:02.000Z'),
      ),
    ).toEqual({ days: 3, hours: 0, minutes: 1, seconds: 2, complete: false });
  });

  it('returns zeroes after the event begins', () => {
    expect(
      getCountdownParts(
        new Date('2026-12-04T09:00:00.000Z'),
        new Date('2026-12-04T08:00:00.000Z'),
      ),
    ).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, complete: true });
  });
});
