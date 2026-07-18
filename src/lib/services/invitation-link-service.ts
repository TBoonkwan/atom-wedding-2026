import { randomBytes } from 'node:crypto';
import type { WeddingRepository } from '@/lib/data/repository';
import { hashToken } from '@/lib/domain/security';

export async function rotateInvitationLink(
  repository: WeddingRepository,
  invitationId: string,
  createRandomBytes: () => Buffer = () => randomBytes(16),
) {
  const token = createRandomBytes().toString('hex');
  const tokenHash = hashToken(token);
  const inviteCode = tokenHash.slice(0, 6).toUpperCase();
  await repository.updateInvitationToken(invitationId, tokenHash, inviteCode);
  return { token, inviteCode };
}
