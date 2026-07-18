import type { Invitation, TableAssignment, WeddingTable } from './types';

export function invitationPartySize(invitation: Invitation) {
  return invitation.adultCount + invitation.childCount;
}

export function listUnassignedAcceptedInvitations(
  invitations: Invitation[],
  assignments: TableAssignment[],
) {
  const assignedInvitationIds = new Set(assignments.map((item) => item.invitationId));
  return invitations.filter((invitation) =>
    invitation.status === 'accepted' && !assignedInvitationIds.has(invitation.id));
}

export function summarizeTables(tables: WeddingTable[], assignments: TableAssignment[]) {
  return tables.map((table) => {
    const tableAssignments = assignments.filter((assignment) => assignment.tableId === table.id);
    const occupied = tableAssignments
      .reduce((total, assignment) => total + assignment.seatCount, 0);
    const remaining = table.capacity - occupied;

    return {
      ...table,
      occupied,
      remaining,
      overCapacity: remaining < 0,
      assignments: tableAssignments,
    };
  });
}

export function validateSeatAssignment(
  invitation: Invitation,
  assignments: TableAssignment[],
  tableId: string,
  seatCount: number,
) {
  if (invitation.status !== 'accepted') return 'เลือกจัดโต๊ะได้เฉพาะ invitation ที่ตอบรับแล้ว';
  const expected = invitationPartySize(invitation);
  const assignedElsewhere = assignments
    .filter((item) => item.invitationId === invitation.id && item.tableId !== tableId)
    .reduce((total, item) => total + item.seatCount, 0);
  if (assignedElsewhere + seatCount > expected) {
    return `จำนวนที่นั่งรวมเกินจำนวนที่ตอบรับไว้ ${expected} คน`;
  }
  return null;
}

export function summarizeInvitationSeats(
  invitations: Invitation[],
  assignments: TableAssignment[],
) {
  return invitations.filter((item) => item.status === 'accepted').map((invitation) => {
    const expected = invitationPartySize(invitation);
    const assigned = assignments
      .filter((item) => item.invitationId === invitation.id)
      .reduce((total, item) => total + item.seatCount, 0);
    return { invitationId: invitation.id, displayName: invitation.displayName, expected, assigned, remaining: expected - assigned };
  });
}
