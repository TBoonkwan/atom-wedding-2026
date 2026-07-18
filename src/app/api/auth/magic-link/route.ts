import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/auth/server';
import { isAllowedHostEmail } from '@/lib/auth/allowlist';
import { jsonError } from '@/lib/http/responses';
import { getSupabaseMode } from '@/lib/auth/supabase-config';
import { consumePublicRateLimit } from '@/lib/http/distributed-rate-limit';
import { trustedClientKey } from '@/lib/http/client-key';

const schema = z.object({ email: z.email() });

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const clientKey = trustedClientKey(request, process.env);
    if (
      !(await consumePublicRateLimit(`magic-link-client:${clientKey}`, { limit: 10, windowSeconds: 600 })) ||
      !(await consumePublicRateLimit(`magic-link-email:${email.toLowerCase()}`, { limit: 5, windowSeconds: 600 }))
    ) {
      return jsonError(new Error('ส่งลิงก์บ่อยเกินไป กรุณารอสักครู่'), 429);
    }
    const mode = getSupabaseMode(process.env);
    if (mode === 'demo') return Response.json({ demo: true });
    if (mode === 'invalid') throw new Error('Supabase configuration is incomplete');
    const supabase = await createServerSupabaseClient();
    if (!supabase) throw new Error('Supabase authentication is unavailable');
    if (!isAllowedHostEmail(email, process.env.HOST_EMAIL_ALLOWLIST)) {
      throw new Error('อีเมลนี้ไม่ได้รับสิทธิ์เข้า dashboard');
    }
    const origin = new URL(request.url).origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) throw error;
    return Response.json({ sent: true });
  } catch (error) {
    return jsonError(error);
  }
}
