import { randomBytes } from 'node:crypto';
import type { GuestImportRow } from '@/lib/domain/csv';
import { hashToken } from '@/lib/domain/security';

export interface NewInvitationRecord extends GuestImportRow {
  inviteCode: string;
  tokenHash: string;
}

export function prepareGuestInvitations(
  rows: GuestImportRow[],
  createRandomBytes: () => Buffer = () => randomBytes(16),
  reservedInviteCodes: Iterable<string> = [],
) {
  const usedCodes = new Set([...reservedInviteCodes].map((code) => code.toUpperCase()));
  return rows.map((row) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const token = createRandomBytes().toString('hex');
      const tokenHash = hashToken(token);
      const inviteCode = tokenHash.slice(0, 6).toUpperCase();
      if (usedCodes.has(inviteCode)) continue;
      usedCodes.add(inviteCode);
      return { token, record: { ...row, inviteCode, tokenHash } };
    }
    throw new Error('ไม่สามารถสร้างรหัสคำเชิญที่ไม่ซ้ำได้');
  });
}

export function buildInvitationLinks(prepared: ReturnType<typeof prepareGuestInvitations>) {
  return prepared.map((item) => ({
    displayName: item.record.displayName,
    inviteCode: item.record.inviteCode,
    token: item.token,
  }));
}
