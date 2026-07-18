import { describe, expect, it } from 'vitest';
import { DemoRepository } from '@/lib/data/demo-repository';
import { rotateInvitationLink } from './invitation-link-service';

describe('rotateInvitationLink', () => {
  it('returns a new raw token while persisting only its hash', async () => {
    const repository = new DemoRepository();
    const result = await rotateInvitationLink(
      repository,
      'demo-1',
      () => Buffer.from('00112233445566778899aabbccddeeff', 'hex'),
    );

    expect(result.token).toBe('00112233445566778899aabbccddeeff');
    expect(result.inviteCode).toHaveLength(6);
    await expect(repository.findInvitationByToken(result.token)).resolves.toMatchObject({
      id: 'demo-1',
      inviteCode: result.inviteCode,
    });
    await expect(repository.findInvitationByToken('demo-np-2026')).resolves.toBeNull();
  });
});
