import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InvitationExperience } from '@/components/invitation/invitation-experience';
import { getRepository } from '@/lib/data/get-repository';
import { buildCalendarUrls } from '@/lib/domain/calendar';
import { getPublicInvitation } from '@/lib/services/invitation-service';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let invitation;
  try {
    invitation = await getPublicInvitation(getRepository(), token);
  } catch {
    notFound();
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return (
    <InvitationExperience
      theme="modern-xi-club"
      mode="personalized"
      token={token}
      initialInvitation={invitation}
      calendarLinks={buildCalendarUrls(token, origin)}
    />
  );
}
