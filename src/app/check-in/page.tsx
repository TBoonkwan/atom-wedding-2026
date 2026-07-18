import { CheckInForm } from '@/components/checkin/checkin-form';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ eventCode?: string }> }) {
  const { eventCode = '' } = await searchParams;
  return (
    <main className="checkin-page">
      <CheckInForm eventCode={eventCode} />
    </main>
  );
}
