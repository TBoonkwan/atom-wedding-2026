import type { WeddingRepository } from '@/lib/data/repository';
import { canEditRsvp, isLateRsvp, validateRsvp } from '@/lib/domain/rsvp';
import { hashToken } from '@/lib/domain/security';
import type { Invitation, RsvpInput } from '@/lib/domain/types';

export function hashInvitationToken(token: string) {
  return hashToken(token);
}

export type PublicInvitation = Pick<
  Invitation,
  | 'inviteCode'
  | 'displayName'
  | 'contactName'
  | 'status'
  | 'adultCount'
  | 'childCount'
  | 'childSeatCount'
  | 'dietaryNotes'
  | 'accessibilityNotes'
  | 'reason'
  | 'beerPreference'
  | 'songRequest'
  | 'lateResponse'
  | 'checkedInCount'
  | 'tableNumbers'
>;

function toPublicInvitation(invitation: Invitation): PublicInvitation {
  return {
    inviteCode: invitation.inviteCode,
    displayName: invitation.displayName,
    contactName: invitation.contactName,
    status: invitation.status,
    adultCount: invitation.adultCount,
    childCount: invitation.childCount,
    childSeatCount: invitation.childSeatCount,
    dietaryNotes: invitation.dietaryNotes,
    accessibilityNotes: invitation.accessibilityNotes,
    reason: invitation.reason,
    beerPreference: invitation.beerPreference,
    songRequest: invitation.songRequest,
    lateResponse: invitation.lateResponse,
    checkedInCount: invitation.checkedInCount,
    tableNumbers: invitation.tableNumbers,
  };
}

export async function getPublicInvitation(repository: WeddingRepository, token: string) {
  const invitation = await repository.findInvitationByToken(token);
  if (!invitation) throw new Error('ไม่พบคำเชิญนี้');
  return toPublicInvitation(invitation);
}

export async function submitRsvp(
  repository: WeddingRepository,
  token: string,
  input: RsvpInput,
  now = new Date(),
) {
  if (!canEditRsvp(now)) throw new Error('ปิดรับการแก้ไข RSVP แล้ว');
  const parsed = validateRsvp(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'ข้อมูล RSVP ไม่ถูกต้อง');
  const invitation = await repository.findInvitationByToken(token);
  if (!invitation) throw new Error('ไม่พบคำเชิญนี้');
  const updated = await repository.updateRsvp(invitation.id, parsed.data, isLateRsvp(now));
  return toPublicInvitation(updated);
}
