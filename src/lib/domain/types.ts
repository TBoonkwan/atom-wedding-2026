export type RsvpStatus = 'pending' | 'accepted' | 'maybe' | 'rejected';
export type BeerPreference = 'ipa' | 'lager' | 'wheat' | 'none';

export interface Invitation {
  id: string;
  inviteCode: string;
  displayName: string;
  contactName: string;
  phone?: string;
  email?: string;
  hostNotes?: string;
  status: RsvpStatus;
  adultCount: number;
  childCount: number;
  childSeatCount: number;
  dietaryNotes?: string;
  accessibilityNotes?: string;
  reason?: string;
  beerPreference: BeerPreference;
  songRequest?: string;
  lateResponse: boolean;
  checkedInCount: number;
  tableNumbers: number[];
  updatedAt?: string;
}

export interface RsvpInput {
  status: Exclude<RsvpStatus, 'pending'>;
  adultCount: number;
  childCount: number;
  childSeatCount: number;
  dietaryNotes: string;
  accessibilityNotes: string;
  beerPreference: BeerPreference;
  songRequest: string;
  reason: string;
}

export interface WeddingTable {
  id: string;
  number: number;
  capacity: number;
  revealed: boolean;
}

export interface TableAssignment {
  invitationId: string;
  tableId: string;
  seatCount: number;
}

export interface CheckIn {
  invitationId: string;
  attendeeCount: number;
  checkedInAt: string;
  correctedBy?: string;
}

export interface RsvpHistoryEntry {
  id: string;
  invitationId: string;
  snapshot: Record<string, unknown>;
  source: 'guest' | 'host';
  createdAt: string;
}

export interface HostAuditLog {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
