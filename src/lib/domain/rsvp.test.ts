import { describe, expect, it } from 'vitest';
import { EVENT_START, RSVP_SOFT_DEADLINE } from './event';
import { canEditRsvp, validateRsvp } from './rsvp';

describe('validateRsvp', () => {
  it('accepts an attending response with child seating details', () => {
    const result = validateRsvp({
      status: 'accepted',
      adultCount: 2,
      childCount: 1,
      childSeatCount: 1,
      dietaryNotes: 'ไม่ทานเนื้อ',
      accessibilityNotes: '',
      beerPreference: 'wheat',
      songRequest: 'September',
      reason: '',
    });

    expect(result.success).toBe(true);
  });

  it.each(['maybe', 'rejected'] as const)(
    'accepts an empty optional reason for %s responses',
    (status) => {
      const result = validateRsvp({
        status,
        adultCount: 0,
        childCount: 0,
        childSeatCount: 0,
        dietaryNotes: '',
        accessibilityNotes: '',
        beerPreference: 'none',
        songRequest: '',
        reason: '  ',
      });

      expect(result.success).toBe(true);
    },
  );

  it('keeps the 500-character limit for an optional reason', () => {
    const result = validateRsvp({
      status: 'maybe',
      adultCount: 0,
      childCount: 0,
      childSeatCount: 0,
      dietaryNotes: '',
      accessibilityNotes: '',
      beerPreference: 'none',
      songRequest: '',
      reason: 'ก'.repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it('rejects more child seats than attending children', () => {
    const result = validateRsvp({
      status: 'accepted',
      adultCount: 2,
      childCount: 1,
      childSeatCount: 2,
      dietaryNotes: '',
      accessibilityNotes: '',
      beerPreference: 'ipa',
      songRequest: '',
      reason: '',
    });

    expect(result.success).toBe(false);
  });

  it('caps the total number of attendees at 300', () => {
    const result = validateRsvp({
      status: 'accepted',
      adultCount: 200,
      childCount: 101,
      childSeatCount: 0,
      dietaryNotes: '',
      accessibilityNotes: '',
      beerPreference: 'none',
      songRequest: '',
      reason: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('RSVP timing', () => {
  it('uses a soft deadline seven days before the event', () => {
    expect(RSVP_SOFT_DEADLINE.toISOString()).toBe('2026-11-27T16:59:59.000Z');
  });

  it('allows edits before 15:00 Bangkok time on the wedding day', () => {
    expect(canEditRsvp(new Date('2026-12-04T07:59:59.000Z'))).toBe(true);
    expect(canEditRsvp(EVENT_START)).toBe(false);
  });
});
