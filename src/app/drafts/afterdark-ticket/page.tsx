import type { Metadata } from 'next';
import { WeddingLandingDraft } from '@/components/drafts/wedding-landing-draft';

export const metadata: Metadata = { title: 'Afterdark Ticket Club · Wedding Draft' };

export default function Page() {
  return <WeddingLandingDraft theme="afterdark-ticket" />;
}
