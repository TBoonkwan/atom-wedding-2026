import type { Invitation, RsvpInput } from '@/lib/domain/types';

export interface DbInvitation {
  id: string;
  invite_code: string;
  display_name: string;
  contact_name: string;
  phone: string | null;
  email: string | null;
  host_notes: string | null;
  status: Invitation['status'];
  adult_count: number;
  child_count: number;
  child_seat_count: number;
  dietary_notes: string | null;
  accessibility_notes: string | null;
  reason: string | null;
  beer_preference: Invitation['beerPreference'];
  song_request: string | null;
  late_response: boolean;
  checked_in_count: number;
  updated_at: string;
  table_numbers?: number[];
}

export function fromDbInvitation(row: DbInvitation): Invitation {
  return {
    id: row.id,
    inviteCode: row.invite_code,
    displayName: row.display_name,
    contactName: row.contact_name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    hostNotes: row.host_notes ?? undefined,
    status: row.status,
    adultCount: row.adult_count,
    childCount: row.child_count,
    childSeatCount: row.child_seat_count,
    dietaryNotes: row.dietary_notes ?? '',
    accessibilityNotes: row.accessibility_notes ?? '',
    reason: row.reason ?? '',
    beerPreference: row.beer_preference,
    songRequest: row.song_request ?? '',
    lateResponse: row.late_response,
    checkedInCount: row.checked_in_count,
    tableNumbers: row.table_numbers ?? [],
    updatedAt: row.updated_at,
  };
}

export function toDbRsvp(input: RsvpInput, lateResponse: boolean) {
  return {
    status: input.status,
    adult_count: input.status === 'accepted' ? input.adultCount : 0,
    child_count: input.status === 'accepted' ? input.childCount : 0,
    child_seat_count: input.status === 'accepted' ? input.childSeatCount : 0,
    dietary_notes: input.dietaryNotes,
    accessibility_notes: input.accessibilityNotes,
    beer_preference: input.beerPreference,
    song_request: input.songRequest,
    reason: input.reason,
    late_response: lateResponse,
    updated_at: new Date().toISOString(),
  };
}
