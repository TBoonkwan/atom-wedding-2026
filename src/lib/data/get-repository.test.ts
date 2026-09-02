import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashToken } from '@/lib/domain/security';

const rotatedToken = '00112233445566778899aabbccddeeff';

describe('getRepository in demo mode', () => {
  afterEach(async () => {
    const { getRepository } = await import('./get-repository');
    await getRepository().updateInvitationToken('demo-1', hashToken('demo-np-2026'), 'NP2026');
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('keeps rotated invitation tokens available after the server module reloads', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    const { getRepository } = await import('./get-repository');
    await getRepository().updateInvitationToken('demo-1', hashToken(rotatedToken), 'ROTATE');

    vi.resetModules();
    const { getRepository: getReloadedRepository } = await import('./get-repository');

    await expect(getReloadedRepository().findInvitationByToken(rotatedToken)).resolves.toMatchObject({
      id: 'demo-1',
      inviteCode: 'ROTATE',
    });
  });
});
