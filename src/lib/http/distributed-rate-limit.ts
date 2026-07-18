import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseMode } from '@/lib/auth/supabase-config';
import { hashToken } from '@/lib/domain/security';
import { FixedWindowRateLimiter } from './rate-limit';

const memoryLimiters = new Map<string, FixedWindowRateLimiter>();

export async function consumePublicRateLimit(
  key: string,
  options: { limit?: number; windowSeconds?: number } = {},
) {
  const limit = options.limit ?? 20;
  const windowSeconds = options.windowSeconds ?? 60;
  const mode = getSupabaseMode(process.env);
  if (mode === 'invalid') return false;
  if (mode === 'demo') {
    const limiterKey = `${limit}:${windowSeconds}`;
    let limiter = memoryLimiters.get(limiterKey);
    if (!limiter) {
      limiter = new FixedWindowRateLimiter(limit, windowSeconds * 1_000);
      memoryLimiters.set(limiterKey, limiter);
    }
    return limiter.consume(hashToken(key)).allowed;
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.rpc('consume_rate_limit', {
    p_key_hash: hashToken(key),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) return false;
  return data === true;
}
