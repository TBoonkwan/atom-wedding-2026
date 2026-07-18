import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isPreviewAuthorized } from '@/lib/auth/preview';
import { getSupabaseMode } from '@/lib/auth/supabase-config';

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/preview') &&
    !isPreviewAuthorized(request.headers.get('authorization'), process.env.PREVIEW_PASSWORD)
  ) {
    return new NextResponse('Preview password required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Wedding previews"' },
    });
  }

  if (getSupabaseMode(process.env) !== 'configured') return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ['/preview/:path*', '/host/:path*', '/api/host/:path*'] };
