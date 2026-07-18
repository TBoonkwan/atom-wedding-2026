import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServerSupabaseClient, provisionAllowedHost } from '@/lib/auth/server';
import { getSupabaseMode } from '@/lib/auth/supabase-config';
import { jsonError } from '@/lib/http/responses';

const schema = z.object({
  username: z.string(),
  password: z.string(),
});

const invalidCredentialsMessage = 'Username หรือ Password ไม่ถูกต้อง';

function primaryHostEmail(allowlist: string | undefined) {
  return allowlist
    ?.split(',')
    .map((email) => email.trim().toLowerCase())
    .find(Boolean);
}

export async function POST(request: Request) {
  const credentials = schema.safeParse(await request.json().catch(() => null));
  if (
    !credentials.success ||
    credentials.data.username !== 'admin' ||
    !process.env.HOST_PASSWORD ||
    credentials.data.password !== process.env.HOST_PASSWORD
  ) {
    return jsonError(new Error(invalidCredentialsMessage), 401);
  }

  try {
    const mode = getSupabaseMode(process.env);
    if (mode === 'demo') return Response.json({ signedIn: true });
    if (mode === 'invalid') throw new Error('Supabase configuration is incomplete');

    const email = primaryHostEmail(process.env.HOST_EMAIL_ALLOWLIST);
    if (!email) throw new Error('Host email is not configured');

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    const tokenHash = link.properties?.hashed_token;
    if (linkError || !tokenHash) throw linkError ?? new Error('Could not create host login token');

    const supabase = await createServerSupabaseClient();
    if (!supabase) throw new Error('Supabase authentication is unavailable');
    const { data, error } = await supabase.auth.verifyOtp({
      type: 'email',
      token_hash: tokenHash,
    });
    if (error || !data.user) throw error ?? new Error('Could not create host session');
    await provisionAllowedHost(data.user);

    return Response.json({ signedIn: true });
  } catch (error) {
    return jsonError(error);
  }
}
