import { describe, expect, it } from 'vitest';
import { fromDbInvitation, toDbRsvp } from './supabase-mappers';

describe('Supabase invitation mappers', () => {
  it('maps snake_case storage fields to the safe domain model', () => {
    const invitation = fromDbInvitation({
      id: 'i1',
      invite_code: 'ABC123',
      display_name: 'ครอบครัวทดสอบ',
      contact_name: 'คุณเอ',
      phone: null,
      email: null,
      host_notes: null,
      status: 'accepted',
      adult_count: 2,
      child_count: 1,
      child_seat_count: 1,
      dietary_notes: null,
      accessibility_notes: null,
      reason: null,
      beer_preference: 'lager',
      song_request: null,
      late_response: false,
      checked_in_count: 3,
      updated_at: '2026-07-17T00:00:00Z',
      table_numbers: [4, 5],
    });

    expect(invitation).toMatchObject({
      inviteCode: 'ABC123',
      displayName: 'ครอบครัวทดสอบ',
      adultCount: 2,
      tableNumbers: [4, 5],
    });
  });

  it('maps RSVP fields without storing an invitation token', () => {
    const stored = toDbRsvp(
      {
        status: 'rejected',
        adultCount: 0,
        childCount: 0,
        childSeatCount: 0,
        dietaryNotes: '',
        accessibilityNotes: '',
        beerPreference: 'none',
        songRequest: '',
        reason: 'ติดงาน',
      },
      true,
    );

    expect(stored).not.toHaveProperty('token');
    expect(stored).toMatchObject({ status: 'rejected', reason: 'ติดงาน', late_response: true });
  });
});
