import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  provisionAllowedHost: vi.fn(),
  generateLink: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/auth/server', () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
  provisionAllowedHost: mocks.provisionAllowedHost,
}));

import { POST } from './route';

describe('password host login route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('rejects a wrong username or password', async () => {
    vi.stubEnv('HOST_PASSWORD', 'pilot-secret');

    const response = await POST(new Request('https://wedding.test/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Username หรือ Password ไม่ถูกต้อง' });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('creates a Supabase session without sending an email when provisioning is deferred', async () => {
    vi.stubEnv('HOST_PASSWORD', 'pilot-secret');
    vi.stubEnv('HOST_EMAIL_ALLOWLIST', 'host@example.com, second@example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://wedding.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const user = { id: 'host-user-id', email: 'host@example.com' };
    mocks.generateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'one-time-token-hash' } },
      error: null,
    });
    mocks.createClient.mockReturnValue({ auth: { admin: { generateLink: mocks.generateLink } } });
    mocks.verifyOtp.mockResolvedValue({ data: { user }, error: null });
    mocks.createServerSupabaseClient.mockResolvedValue({ auth: { verifyOtp: mocks.verifyOtp } });
    mocks.provisionAllowedHost.mockResolvedValue(false);

    const response = await POST(new Request('https://wedding.test/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pilot-secret' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ signedIn: true });
    expect(mocks.generateLink).toHaveBeenCalledWith({ type: 'magiclink', email: 'host@example.com' });
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'one-time-token-hash' });
    expect(mocks.provisionAllowedHost).toHaveBeenCalledWith(user);
  });
});
