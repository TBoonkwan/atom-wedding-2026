import 'server-only';
import { DemoRepository } from './demo-repository';
import { createSupabaseRepository } from './supabase-repository';
import { getSupabaseMode } from '@/lib/auth/supabase-config';

const demoRepository = new DemoRepository();

export function getRepository() {
  const mode = getSupabaseMode(process.env);
  if (mode === 'demo') return demoRepository;
  if (mode === 'invalid') throw new Error('Supabase environment variables are incomplete');
  const repository = createSupabaseRepository();
  if (!repository) throw new Error('Supabase repository is unavailable');
  return repository;
}
