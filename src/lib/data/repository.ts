import type {
  CheckIn,
  Invitation,
  RsvpInput,
  RsvpHistoryEntry,
  TableAssignment,
  WeddingTable,
} from '@/lib/domain/types';
import type { NewInvitationRecord } from '@/lib/services/guest-import';

export interface WeddingRepository {
  findInvitationByToken(token: string): Promise<Invitation | null>;
  findInvitationByCode(code: string): Promise<Invitation | null>;
  listInvitations(): Promise<Invitation[]>;
  listRsvpHistory(invitationId: string): Promise<RsvpHistoryEntry[]>;
  updateRsvp(invitationId: string, input: RsvpInput, lateResponse: boolean): Promise<Invitation>;
  upsertCheckIn(checkIn: CheckIn): Promise<Invitation>;
  removeCheckIn(invitationId: string): Promise<Invitation>;
  getCheckInCode(): Promise<string | null>;
  listTables(): Promise<WeddingTable[]>;
  listTableAssignments(): Promise<TableAssignment[]>;
  createInvitations(records: NewInvitationRecord[]): Promise<Invitation[]>;
  updateInvitationDetails(
    invitationId: string,
    details: Pick<Invitation, 'displayName' | 'contactName' | 'phone' | 'email' | 'hostNotes'>,
  ): Promise<Invitation>;
  updateInvitationToken(
    invitationId: string,
    tokenHash: string,
    inviteCode: string,
  ): Promise<Invitation>;
  setTableAssignment(invitationId: string, tableId: string, seatCount: number): Promise<void>;
  removeTableAssignment(invitationId: string, tableId: string): Promise<void>;
  setTableRevealed(tableId: string, revealed: boolean): Promise<void>;
  setCheckInEnabled(enabled: boolean): Promise<string | null>;
  recordAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}
