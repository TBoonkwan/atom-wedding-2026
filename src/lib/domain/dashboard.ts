import type { BeerPreference, Invitation, RsvpStatus } from './types';

const emptyStatuses: Record<RsvpStatus, number> = {
  accepted: 0,
  maybe: 0,
  rejected: 0,
  pending: 0,
};

const emptyBeerPreferences: Record<BeerPreference, number> = {
  ipa: 0,
  lager: 0,
  wheat: 0,
  none: 0,
};

export function summarizeInvitations(invitations: Invitation[]) {
  return invitations.reduce(
    (summary, invitation) => {
      summary.statuses[invitation.status] += 1;
      summary.expectedGuests += invitation.adultCount + invitation.childCount;
      summary.children += invitation.childCount;
      summary.childSeats += invitation.childSeatCount;
      summary.checkedInGuests += invitation.checkedInCount;
      summary.lateResponses += Number(invitation.lateResponse);
      summary.beerPreferences[invitation.beerPreference] += 1;
      if (invitation.dietaryNotes?.trim()) {
        summary.allergies.push({ displayName: invitation.displayName, notes: invitation.dietaryNotes });
      }
      if (invitation.accessibilityNotes?.trim()) {
        summary.accessibilityNeeds.push({
          displayName: invitation.displayName,
          notes: invitation.accessibilityNotes,
        });
      }
      return summary;
    },
    {
      statuses: { ...emptyStatuses },
      expectedGuests: 0,
      children: 0,
      childSeats: 0,
      checkedInGuests: 0,
      lateResponses: 0,
      beerPreferences: { ...emptyBeerPreferences },
      allergies: [] as { displayName: string; notes: string }[],
      accessibilityNeeds: [] as { displayName: string; notes: string }[],
      capacity: 300,
    },
  );
}
