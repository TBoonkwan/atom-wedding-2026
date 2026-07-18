import type { WeddingRepository } from '@/lib/data/repository';

export async function correctCheckIn(
  repository: WeddingRepository,
  invitationId: string,
  attendeeCount: number,
  correctedBy?: string,
) {
  if (!Number.isInteger(attendeeCount) || attendeeCount < 0 || attendeeCount > 300) {
    throw new Error('จำนวนผู้เช็กอินไม่ถูกต้อง');
  }
  if (attendeeCount === 0) return repository.removeCheckIn(invitationId);
  return repository.upsertCheckIn({
    invitationId,
    attendeeCount,
    checkedInAt: new Date().toISOString(),
    correctedBy,
  });
}
