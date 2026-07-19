import type { Metadata } from 'next';
import { DraftIndex } from '@/components/drafts/draft-index';

export const metadata: Metadata = { title: 'Wedding Landing Drafts' };

export default function DraftsPage() {
  return <DraftIndex />;
}
