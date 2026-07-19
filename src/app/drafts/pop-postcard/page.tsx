import type { Metadata } from 'next';
import { WeddingLandingDraft } from '@/components/drafts/wedding-landing-draft';

export const metadata: Metadata = { title: 'Pop Postcard Collage · Wedding Draft' };

export default function Page() {
  return <WeddingLandingDraft theme="pop-postcard" />;
}
