import { describe, expect, it } from 'vitest';
import { summarizeInvitationSeats, summarizeTables, validateSeatAssignment } from './tables';
import type { Invitation } from './types';

const acceptedInvitation: Invitation = {
  id: 'i1', inviteCode: 'ABC123', displayName: 'ครอบครัวเอ', contactName: 'คุณเอ',
  status: 'accepted', adultCount: 3, childCount: 1, childSeatCount: 0,
  beerPreference: 'none', lateResponse: false, checkedInCount: 0, tableNumbers: [],
};

describe('summarizeTables', () => {
  it('supports split assignments and flags tables over capacity', () => {
    const summary = summarizeTables(
      [
        { id: 't1', number: 1, capacity: 10, revealed: true },
        { id: 't2', number: 2, capacity: 10, revealed: false },
      ],
      [
        { invitationId: 'i1', tableId: 't1', seatCount: 8 },
        { invitationId: 'i2', tableId: 't1', seatCount: 4 },
        { invitationId: 'i2', tableId: 't2', seatCount: 2 },
      ],
    );

    expect(summary[0]).toMatchObject({ occupied: 12, remaining: -2, overCapacity: true });
    expect(summary[1]).toMatchObject({ occupied: 2, remaining: 8, overCapacity: false });
    expect(summary[0].assignments).toEqual([
      { invitationId: 'i1', tableId: 't1', seatCount: 8 },
      { invitationId: 'i2', tableId: 't1', seatCount: 4 },
    ]);
  });

  it('reconciles split-table seats against the accepted party size', () => {
    const assignments = [{ invitationId: 'i1', tableId: 't1', seatCount: 2 }];
    expect(validateSeatAssignment(acceptedInvitation, assignments, 't2', 2)).toBeNull();
    expect(validateSeatAssignment(acceptedInvitation, assignments, 't2', 3)).toContain('เกินจำนวนที่ตอบรับ');
    expect(summarizeInvitationSeats([acceptedInvitation], assignments)[0]).toMatchObject({
      expected: 4, assigned: 2, remaining: 2,
    });
  });
});
