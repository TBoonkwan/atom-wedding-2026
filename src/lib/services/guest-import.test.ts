import { describe, expect, it } from 'vitest';
import { buildInvitationLinks, prepareGuestInvitations } from './guest-import';

describe('prepareGuestInvitations', () => {
  it('creates a raw share token while storing only its hash', () => {
    const prepared = prepareGuestInvitations(
      [
        {
          displayName: 'ครอบครัวสุขใจ',
          contactName: 'คุณเอ',
          phone: '',
          email: '',
          hostNotes: '',
        },
      ],
      () => Buffer.from('00112233445566778899aabbccddeeff', 'hex'),
    );

    expect(prepared[0].token).toBe('00112233445566778899aabbccddeeff');
    expect(prepared[0].record.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(prepared[0].record).not.toHaveProperty('token');
    expect(prepared[0].record.inviteCode).toHaveLength(6);
  });

  it('builds one-time links from prepared records without relying on database return order', () => {
    const prepared = prepareGuestInvitations(
      [{ displayName: 'ครอบครัวเอ', contactName: 'คุณเอ', phone: '', email: '', hostNotes: '' }],
      () => Buffer.from('ffeeddccbbaa99887766554433221100', 'hex'),
    );

    expect(buildInvitationLinks(prepared)).toEqual([{
      displayName: 'ครอบครัวเอ',
      inviteCode: prepared[0].record.inviteCode,
      token: prepared[0].token,
    }]);
  });

  it('regenerates a six-character code when a collision is detected', () => {
    const buffers = [
      Buffer.from('00112233445566778899aabbccddeeff', 'hex'),
      Buffer.from('00112233445566778899aabbccddeeff', 'hex'),
      Buffer.from('11112222333344445555666677778888', 'hex'),
    ];
    const rows = ['เอ', 'บี'].map((name) => ({
      displayName: name, contactName: name, phone: '', email: '', hostNotes: '',
    }));
    const prepared = prepareGuestInvitations(rows, () => buffers.shift()!);

    expect(new Set(prepared.map((item) => item.record.inviteCode)).size).toBe(2);
  });
});
