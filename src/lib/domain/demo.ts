import type { PublicInvitation } from '@/lib/services/invitation-service';

export const DEMO_PUBLIC_INVITATION: PublicInvitation = {
  inviteCode: 'NP2026',
  displayName: 'ครอบครัวเพื่อนเจ้าบ่าว',
  contactName: 'คุณเพื่อน',
  status: 'pending',
  adultCount: 0,
  childCount: 0,
  childSeatCount: 0,
  dietaryNotes: '',
  accessibilityNotes: '',
  reason: '',
  beerPreference: 'none',
  songRequest: '',
  lateResponse: false,
  checkedInCount: 0,
  tableNumbers: [8],
};
