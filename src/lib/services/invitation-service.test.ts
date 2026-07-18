import { describe, expect, it } from 'vitest';
import { DemoRepository } from '@/lib/data/demo-repository';
import { getPublicInvitation, hashInvitationToken, submitRsvp } from './invitation-service';

describe('invitation service', () => {
  it('returns only guest-safe invitation fields', async () => {
    const repository = new DemoRepository();
    const invitation = await getPublicInvitation(repository, 'demo-np-2026');

    expect(invitation).toMatchObject({
      displayName: 'ครอบครัวเพื่อนเจ้าบ่าว',
      inviteCode: 'NP2026',
    });
    expect(invitation).not.toHaveProperty('phone');
    expect(invitation).not.toHaveProperty('hostNotes');
  });

  it('supports the short demo token in the local demo repository', async () => {
    const repository = new DemoRepository();

    await expect(getPublicInvitation(repository, 'demo')).resolves.toMatchObject({
      displayName: 'ครอบครัวเพื่อนเจ้าบ่าว',
      inviteCode: 'NP2026',
    });
  });

  it('hashes invitation tokens before persistence', () => {
    expect(hashInvitationToken('secret')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInvitationToken('secret')).not.toBe('secret');
  });

  it('updates a valid RSVP and marks a response after the soft deadline as late', async () => {
    const repository = new DemoRepository();

    const updated = await submitRsvp(
      repository,
      'demo-np-2026',
      {
        status: 'accepted',
        adultCount: 2,
        childCount: 1,
        childSeatCount: 1,
        dietaryNotes: '',
        accessibilityNotes: '',
        beerPreference: 'lager',
        songRequest: 'Dancing Queen',
        reason: '',
      },
      new Date('2026-11-28T01:00:00.000Z'),
    );

    expect(updated.status).toBe('accepted');
    expect(updated.lateResponse).toBe(true);
    expect(updated.adultCount + updated.childCount).toBe(3);
  });
});
