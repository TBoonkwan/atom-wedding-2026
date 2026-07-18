import { describe, expect, it } from 'vitest';
import { summarizeInvitations } from './dashboard';
import type { Invitation } from './types';

const invitations: Invitation[] = [
  {
    id: '1',
    inviteCode: 'AAA111',
    displayName: 'ครอบครัวใจดี',
    contactName: 'คุณเอ',
    status: 'accepted',
    adultCount: 4,
    childCount: 1,
    childSeatCount: 1,
    dietaryNotes: 'แพ้ถั่วลิสง',
    accessibilityNotes: 'ใช้รถเข็น',
    beerPreference: 'ipa',
    lateResponse: false,
    checkedInCount: 3,
    tableNumbers: [1],
  },
  {
    id: '2',
    inviteCode: 'BBB222',
    displayName: 'คุณบี',
    contactName: 'คุณบี',
    status: 'maybe',
    adultCount: 0,
    childCount: 0,
    childSeatCount: 0,
    beerPreference: 'none',
    lateResponse: true,
    checkedInCount: 0,
    tableNumbers: [],
  },
  {
    id: '3',
    inviteCode: 'CCC333',
    displayName: 'คุณซี',
    contactName: 'คุณซี',
    status: 'pending',
    adultCount: 0,
    childCount: 0,
    childSeatCount: 0,
    beerPreference: 'none',
    lateResponse: false,
    checkedInCount: 0,
    tableNumbers: [],
  },
];

describe('summarizeInvitations', () => {
  it('summarizes RSVP, attendance, late replies, and beer preference', () => {
    const summary = summarizeInvitations(invitations);

    expect(summary.statuses).toEqual({
      accepted: 1,
      maybe: 1,
      rejected: 0,
      pending: 1,
    });
    expect(summary.expectedGuests).toBe(5);
    expect(summary.checkedInGuests).toBe(3);
    expect(summary.childSeats).toBe(1);
    expect(summary.lateResponses).toBe(1);
    expect(summary.beerPreferences.ipa).toBe(1);
    expect(summary.allergies).toEqual([{ displayName: 'ครอบครัวใจดี', notes: 'แพ้ถั่วลิสง' }]);
    expect(summary.accessibilityNeeds).toEqual([{ displayName: 'ครอบครัวใจดี', notes: 'ใช้รถเข็น' }]);
  });
});
