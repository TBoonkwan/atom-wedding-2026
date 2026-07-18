export type SupabaseMode = 'demo' | 'configured' | 'invalid';

export function getSupabaseMode(environment: Record<string, string | undefined>): SupabaseMode {
  const values = [
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    environment.SUPABASE_SERVICE_ROLE_KEY,
  ];
  const present = values.filter((value) => Boolean(value?.trim())).length;
  if (present === 0) return 'demo';
  return present === values.length ? 'configured' : 'invalid';
}
