import { z } from 'zod';
import type { WeddingRepository } from '@/lib/data/repository';
import { canEditRsvp, isLateRsvp, validateRsvp } from '@/lib/domain/rsvp';
import { hashToken } from '@/lib/domain/security';
import { toPublicInvitation } from './invitation-service';

const identitySchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(160),
  submissionId: z.uuid(),
});

export async function submitPublicRsvp(repository: WeddingRepository, input: unknown, now = new Date()) {
  if (!canEditRsvp(now)) throw new Error('ปิดรับการแก้ไข RSVP แล้ว');
  const { name, submissionId } = identitySchema.parse(input);
  const parsed = validateRsvp(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'ข้อมูล RSVP ไม่ถูกต้อง');
  const token = `public-rsvp:${submissionId}`;
  const existing = await repository.findInvitationByToken(token);
  if (existing) return toPublicInvitation(existing);
  const tokenHash = hashToken(token);
  try {
    const [created] = await repository.createInvitations([{
      displayName: name, contactName: name, phone: '', email: '', hostNotes: '',
      tokenHash, inviteCode: tokenHash.slice(0, 12).toUpperCase(),
      rsvp: parsed.data, lateResponse: isLateRsvp(now),
    }]);
    return toPublicInvitation(created);
  } catch (error) {
    // A concurrent retry may have committed the same submission first.
    const saved = await repository.findInvitationByToken(token);
    if (saved) return toPublicInvitation(saved);
    throw error;
  }
}
