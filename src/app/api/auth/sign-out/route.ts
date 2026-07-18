import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/server';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/host', request.url), 303);
}
