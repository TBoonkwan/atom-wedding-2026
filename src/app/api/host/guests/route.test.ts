import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Invitation } from '@/lib/domain/types';
import type { NewInvitationRecord } from '@/lib/services/guest-import';

const mocks = vi.hoisted(() => ({
  getHostSession: vi.fn(),
  listInvitations: vi.fn(),
  createInvitations: vi.fn(),
  recordAudit: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ getHostSession: mocks.getHostSession }));
vi.mock('@/lib/data/get-repository', () => ({
  getRepository: () => ({
    listInvitations: mocks.listInvitations,
    createInvitations: mocks.createInvitations,
    recordAudit: mocks.recordAudit,
  }),
}));

import { POST } from './route';

function invitation(
  record: Pick<NewInvitationRecord, 'displayName' | 'contactName' | 'phone' | 'email' | 'hostNotes' | 'inviteCode'>,
  id = 'created-1',
): Invitation {
  return {
    id,
    inviteCode: record.inviteCode,
    displayName: record.displayName,
    contactName: record.contactName,
    phone: record.phone || undefined,
    email: record.email || undefined,
    hostNotes: record.hostNotes || undefined,
    status: 'pending',
    adultCount: 0,
    childCount: 0,
    childSeatCount: 0,
    beerPreference: 'none',
    lateResponse: false,
    checkedInCount: 0,
    tableNumbers: [],
  };
}

describe('host guests route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHostSession.mockResolvedValue({ id: 'host-1', email: 'host@example.com' });
    mocks.listInvitations.mockResolvedValue([]);
    mocks.createInvitations.mockImplementation(async (records: NewInvitationRecord[]) =>
      records.map((record, index) => invitation(record, `created-${index + 1}`)));
    mocks.recordAudit.mockResolvedValue(undefined);
  });

  it('creates one invitation and returns its one-time link', async () => {
    const response = await POST(new Request('https://wedding.test/api/host/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest: {
          displayName: 'ครอบครัวสุขใจ',
          contactName: 'คุณเอ',
          phone: '0812345678',
          email: 'a@example.com',
          hostNotes: 'เพื่อนเจ้าบ่าว',
        },
      }),
    }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      imported: 1,
      links: [{ displayName: 'ครอบครัวสุขใจ' }],
    });
    expect(data.links[0].token).toMatch(/^[a-f0-9]{32}$/);
    expect(data.links[0].inviteCode).toMatch(/^[A-F0-9]{6}$/);

    const [records] = mocks.createInvitations.mock.calls[0] as [NewInvitationRecord[]];
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      displayName: 'ครอบครัวสุขใจ',
      contactName: 'คุณเอ',
      phone: '0812345678',
      email: 'a@example.com',
      hostNotes: 'เพื่อนเจ้าบ่าว',
    });
    expect(records[0]).not.toHaveProperty('token');
    expect(records[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.recordAudit).toHaveBeenCalledWith(
      'host-1', 'guest_create', 'invitation', 'created-1', { count: 1 },
    );
  });

  it('rejects a duplicate email without creating an invitation', async () => {
    mocks.listInvitations.mockResolvedValue([
      invitation({
        displayName: 'ครอบครัวเดิม',
        contactName: 'คุณเดิม',
        phone: '',
        email: 'A@example.com',
        hostNotes: '',
        inviteCode: 'OLD123',
      }, 'existing-1'),
    ]);

    const response = await POST(new Request('https://wedding.test/api/host/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest: {
          displayName: 'ครอบครัวใหม่',
          contactName: 'คุณใหม่',
          email: 'a@example.com',
        },
      }),
    }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      rows: [],
      errors: ['email หรือโทรศัพท์มีอยู่ในระบบแล้ว'],
    });
    expect(mocks.createInvitations).not.toHaveBeenCalled();
  });

  it('rejects invalid manual guest details before creating an invitation', async () => {
    const response = await POST(new Request('https://wedding.test/api/host/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest: {
          displayName: 'ครอบครัวใหม่',
          contactName: 'คุณใหม่',
          email: 'not-an-email',
        },
      }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.createInvitations).not.toHaveBeenCalled();
    expect(mocks.recordAudit).not.toHaveBeenCalled();
  });

  it('preserves CSV import and its audit action', async () => {
    const response = await POST(new Request('https://wedding.test/api/host/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csv: [
          'display_name,contact_name,phone,email,host_notes',
          'ครอบครัว CSV,คุณซี,0899999999,csv@example.com,เพื่อน',
        ].join('\n'),
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.createInvitations).toHaveBeenCalledTimes(1);
    expect(mocks.recordAudit).toHaveBeenCalledWith(
      'host-1', 'guest_import', 'invitation', undefined, { count: 1 },
    );
  });
});
