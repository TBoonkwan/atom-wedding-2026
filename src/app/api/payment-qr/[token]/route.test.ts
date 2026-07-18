import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  download: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('node:fs/promises', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:fs/promises')>()),
  readFile: mocks.readFile,
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/data/get-repository', () => ({ getRepository: vi.fn(() => ({})) }));
vi.mock('@/lib/services/invitation-service', () => ({
  getPublicInvitation: vi.fn(async () => ({ id: 'invitation-id' })),
}));
vi.mock('@/lib/http/distributed-rate-limit', () => ({
  consumePublicRateLimit: vi.fn(async () => true),
}));
vi.mock('@/lib/http/client-key', () => ({ trustedClientKey: vi.fn(() => 'client-key') }));

import { GET } from './route';

describe('payment QR route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('downloads the private QR from Supabase Storage when production is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://wedding.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const image = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
    mocks.download.mockResolvedValue({ data: image, error: null });
    mocks.createClient.mockReturnValue({
      storage: { from: vi.fn(() => ({ download: mocks.download })) },
    });

    const response = await GET(
      new Request('https://wedding.test/api/payment-qr/invitation-token'),
      { params: Promise.resolve({ token: 'invitation-token' }) } as never,
    );

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(mocks.createClient).toHaveBeenCalledWith(
      'https://wedding.supabase.co',
      'service-role-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    expect(mocks.download).toHaveBeenCalledWith('payment-qr.png');
    expect(mocks.readFile).not.toHaveBeenCalled();
  });
});
