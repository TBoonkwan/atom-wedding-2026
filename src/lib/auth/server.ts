import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient, type User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isAllowedHostEmail } from './allowlist';
import { getSupabaseMode } from './supabase-config';

export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}

export interface HostSession {
  id: string;
  email: string;
  demo: boolean;
}

export async function provisionAllowedHost(user: User) {
  if (!user.email || !isAllowedHostEmail(user.email, process.env.HOST_EMAIL_ALLOWLIST)) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return false;
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.from('host_users').upsert({
    user_id: user.id,
    email: user.email.toLowerCase(),
    display_name: user.user_metadata?.full_name ?? user.email.split('@')[0],
  });
  return !error;
}

export async function getHostSession(): Promise<HostSession | null> {
  const mode = getSupabaseMode(process.env);
  if (mode === 'demo') return { id: 'demo-host', email: 'demo@local', demo: true };
  if (mode === 'invalid') return null;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  const email = data.user.email;
  const allowedByEnvironment = isAllowedHostEmail(email, process.env.HOST_EMAIL_ALLOWLIST);
  const { data: host } = await supabase
    .from('host_users')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (!host && (!allowedByEnvironment || !(await provisionAllowedHost(data.user)))) return null;

  return { id: data.user.id, email, demo: false };
}
