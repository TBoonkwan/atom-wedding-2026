import { InvitationExperience } from '@/components/invitation/invitation-experience';
import { buildCalendarUrls } from '@/lib/domain/calendar';

export default function Home() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const calendarLink = buildCalendarUrls('public-invitation', origin).google;

  return (
    <InvitationExperience
      theme="modern-xi-club"
      mode="public"
      calendarLink={calendarLink}
    />
  );
}
