import { NextResponse } from 'next/server';
import { createServerSupabaseClient, provisionAllowedHost } from '@/lib/auth/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const supabase = await createServerSupabaseClient();
  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
    const { data } = await supabase.auth.getUser();
    if (data.user) await provisionAllowedHost(data.user);
  }
  return NextResponse.redirect(new URL('/host', url.origin));
}
