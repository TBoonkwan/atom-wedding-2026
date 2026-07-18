import { getHostSession } from '@/lib/auth/server';
import { HostDashboard } from '@/components/host/host-dashboard';
import { HostLogin } from '@/components/host/host-login';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function HostPage() {
  const session = await getHostSession();
  if (!session) return <HostLogin />;
  return <HostDashboard email={session.email} demo={session.demo} />;
}
