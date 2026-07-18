import type { PublicInvitation } from '@/lib/services/invitation-service';

export const PUBLIC_WEDDING_PRESENTATION: PublicInvitation = {
  inviteCode: '',
  displayName: '',
  contactName: '',
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
  tableNumbers: [],
};
