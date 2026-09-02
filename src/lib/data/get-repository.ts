import 'server-only';
import { join } from 'node:path';
import { DemoRepository } from './demo-repository';
import { createSupabaseRepository } from './supabase-repository';
import { getSupabaseMode } from '@/lib/auth/supabase-config';

const demoGlobal = globalThis as typeof globalThis & {
  __atomWeddingDemoRepository?: DemoRepository;
};

const demoStatePath = process.env.NODE_ENV === 'development'
  ? join(process.cwd(), '.data', 'demo-repository.json')
  : undefined;
const demoRepository = (demoGlobal.__atomWeddingDemoRepository ??= new DemoRepository({
  statePath: demoStatePath,
}));

export function getRepository() {
  const mode = getSupabaseMode(process.env);
  if (mode === 'demo') return demoRepository;
  if (mode === 'invalid') throw new Error('Supabase environment variables are incomplete');
  const repository = createSupabaseRepository();
  if (!repository) throw new Error('Supabase repository is unavailable');
  return repository;
}
