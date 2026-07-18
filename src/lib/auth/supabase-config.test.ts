import { describe, expect, it } from 'vitest';
import { getSupabaseMode } from './supabase-config';

describe('getSupabaseMode', () => {
  it('uses demo mode only when no Supabase values are present', () => {
    expect(getSupabaseMode({})).toBe('demo');
  });

  it('requires URL, anon key, and service-role key together', () => {
    expect(getSupabaseMode({
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    })).toBe('invalid');
    expect(getSupabaseMode({
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    })).toBe('configured');
  });
});
