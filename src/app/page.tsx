import { CanvaWeddingExperience } from '@/components/invitation/canva-wedding-experience';
import { buildCalendarUrls } from '@/lib/domain/calendar';

export default function Home() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const calendarLink = buildCalendarUrls('public-invitation', origin).google;

  return (
    <CanvaWeddingExperience
      mode="public"
      calendarLink={calendarLink}
    />
  );
}
