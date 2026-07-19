import type { Metadata } from 'next';
import { WeddingLandingDraft } from '@/components/drafts/wedding-landing-draft';

export const metadata: Metadata = { title: 'Neon Editorial Party · Wedding Draft' };

export default function Page() {
  return <WeddingLandingDraft theme="neon-editorial" />;
}
