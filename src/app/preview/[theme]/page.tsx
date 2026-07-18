import { notFound } from 'next/navigation';
import { buildCalendarUrls } from '@/lib/domain/calendar';
import { DEMO_PUBLIC_INVITATION } from '@/lib/domain/demo';
import {
  InvitationExperience,
  type DraftTheme,
} from '@/components/invitation/invitation-experience';

const themes: DraftTheme[] = ['blush-shanghai', 'tea-to-toast', 'modern-xi-club'];

export default async function PreviewPage({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  if (!themes.includes(theme as DraftTheme)) notFound();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return (
    <InvitationExperience
      theme={theme as DraftTheme}
      token="demo-np-2026"
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={buildCalendarUrls('demo-np-2026', origin)}
      preview
    />
  );
}
