import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { hashToken } from '@/lib/domain/security';
import type { CheckIn, RsvpHistoryEntry, RsvpInput, TableAssignment, WeddingTable } from '@/lib/domain/types';
import type { Invitation } from '@/lib/domain/types';
import type { NewInvitationRecord } from '@/lib/services/guest-import';
import { fromDbInvitation, toDbRsvp, type DbInvitation } from './supabase-mappers';
import type { WeddingRepository } from './repository';

type TableRow = { id: string; number: number; capacity: number; revealed: boolean };
type AssignmentRow = { invitation_id: string; table_id: string; seat_count: number };

export class SupabaseRepository implements WeddingRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async attachTableNumbers(row: DbInvitation) {
    const { data, error } = await this.client
      .from('table_assignments')
      .select('wedding_tables!inner(number,revealed)')
      .eq('invitation_id', row.id)
      .eq('wedding_tables.revealed', true);
    if (error) throw error;
    const tableNumbers = (data ?? []).flatMap((item) => {
      const table = item.wedding_tables as unknown as { number: number } | null;
      return table ? [table.number] : [];
    });
    return fromDbInvitation({ ...row, table_numbers: tableNumbers });
  }

  async findInvitationByToken(token: string) {
    const { data, error } = await this.client
      .from('invitations')
      .select('*')
      .eq('token_hash', hashToken(token))
      .maybeSingle();
    if (error) throw error;
    return data ? this.attachTableNumbers(data as DbInvitation) : null;
  }

  async findInvitationByCode(code: string) {
    const { data, error } = await this.client
      .from('invitations')
      .select('*')
      .eq('invite_code', code.trim().toUpperCase())
      .maybeSingle();
    if (error) throw error;
    return data ? this.attachTableNumbers(data as DbInvitation) : null;
  }

  async listInvitations() {
    const [{ data, error }, { data: assignmentData, error: assignmentError }] = await Promise.all([
      this.client.from('invitations').select('*').order('display_name'),
      this.client.from('table_assignments').select('invitation_id,wedding_tables!inner(number)'),
    ]);
    if (error) throw error;
    if (assignmentError) throw assignmentError;
    const tableNumbersByInvitation = new Map<string, number[]>();
    for (const item of assignmentData ?? []) {
      const table = item.wedding_tables as unknown as { number: number } | null;
      if (!table) continue;
      const numbers = tableNumbersByInvitation.get(item.invitation_id) ?? [];
      numbers.push(table.number);
      tableNumbersByInvitation.set(item.invitation_id, numbers);
    }
    return (data as DbInvitation[]).map((row) => fromDbInvitation({
      ...row,
      table_numbers: tableNumbersByInvitation.get(row.id) ?? [],
    }));
  }

  async listRsvpHistory(invitationId: string): Promise<RsvpHistoryEntry[]> {
    const { data, error } = await this.client
      .from('rsvp_history')
      .select('id,invitation_id,snapshot,source,created_at')
      .eq('invitation_id', invitationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: String(row.id),
      invitationId: row.invitation_id,
      snapshot: row.snapshot as Record<string, unknown>,
      source: row.source as 'guest' | 'host',
      createdAt: row.created_at,
    }));
  }

  async updateRsvp(invitationId: string, input: RsvpInput, lateResponse: boolean) {
    const fields = toDbRsvp(input, lateResponse);
    const { data, error } = await this.client
      .rpc('submit_rsvp_transaction', {
        p_invitation_id: invitationId,
        p_fields: fields,
      })
      .single();
    if (error) throw error;
    return this.attachTableNumbers(data as DbInvitation);
  }

  async upsertCheckIn(checkIn: CheckIn) {
    const { data, error } = await this.client
      .rpc('apply_check_in_transaction', {
        p_invitation_id: checkIn.invitationId,
        p_attendee_count: checkIn.attendeeCount,
        p_checked_in_at: checkIn.checkedInAt,
        p_corrected_by: checkIn.correctedBy ?? null,
      })
      .single();
    if (error) throw error;
    return this.attachTableNumbers(data as DbInvitation);
  }

  async removeCheckIn(invitationId: string) {
    const { data, error } = await this.client
      .rpc('cancel_check_in_transaction', { p_invitation_id: invitationId })
      .single();
    if (error) throw error;
    return this.attachTableNumbers(data as DbInvitation);
  }

  async getCheckInCode() {
    const { data, error } = await this.client
      .from('event_config')
      .select('check_in_code,check_in_enabled')
      .eq('id', 'np-wedding-2026')
      .single();
    if (error) throw error;
    return data.check_in_enabled ? data.check_in_code : null;
  }

  async listTables(): Promise<WeddingTable[]> {
    const { data, error } = await this.client.from('wedding_tables').select('*').order('number');
    if (error) throw error;
    return (data as TableRow[]).map((row) => ({
      id: row.id,
      number: row.number,
      capacity: row.capacity,
      revealed: row.revealed,
    }));
  }

  async listTableAssignments(): Promise<TableAssignment[]> {
    const { data, error } = await this.client.from('table_assignments').select('*');
    if (error) throw error;
    return (data as AssignmentRow[]).map((row) => ({
      invitationId: row.invitation_id,
      tableId: row.table_id,
      seatCount: row.seat_count,
    }));
  }

  async createInvitations(records: NewInvitationRecord[]) {
    const { data, error } = await this.client
      .from('invitations')
      .insert(
        records.map((record) => ({
          invite_code: record.inviteCode,
          token_hash: record.tokenHash,
          display_name: record.displayName,
          contact_name: record.contactName,
          phone: record.phone || null,
          email: record.email || null,
          host_notes: record.hostNotes || null,
        })),
      )
      .select('*');
    if (error) throw error;
    return (data as DbInvitation[]).map((row) => fromDbInvitation({ ...row, table_numbers: [] }));
  }

  async updateInvitationDetails(
    invitationId: string,
    details: Pick<Invitation, 'displayName' | 'contactName' | 'phone' | 'email' | 'hostNotes'>,
  ) {
    const { data, error } = await this.client
      .from('invitations')
      .update({
        display_name: details.displayName,
        contact_name: details.contactName,
        phone: details.phone || null,
        email: details.email || null,
        host_notes: details.hostNotes || null,
      })
      .eq('id', invitationId)
      .select('*')
      .single();
    if (error) throw error;
    return this.attachTableNumbers(data as DbInvitation);
  }

  async updateInvitationToken(invitationId: string, tokenHash: string, inviteCode: string) {
    const { data, error } = await this.client
      .from('invitations')
      .update({ token_hash: tokenHash, invite_code: inviteCode })
      .eq('id', invitationId)
      .select('*')
      .single();
    if (error) throw error;
    return this.attachTableNumbers(data as DbInvitation);
  }

  async setTableAssignment(invitationId: string, tableId: string, seatCount: number) {
    const { error } = await this.client.rpc('set_table_assignment_transaction', {
      p_invitation_id: invitationId,
      p_table_id: tableId,
      p_seat_count: seatCount,
    });
    if (error) throw error;
  }

  async removeTableAssignment(invitationId: string, tableId: string) {
    const { error } = await this.client
      .from('table_assignments')
      .delete()
      .eq('invitation_id', invitationId)
      .eq('table_id', tableId);
    if (error) throw error;
  }

  async setTableRevealed(tableId: string, revealed: boolean) {
    const { error } = await this.client
      .from('wedding_tables')
      .update({ revealed })
      .eq('id', tableId);
    if (error) throw error;
  }

  async setCheckInEnabled(enabled: boolean) {
    const code = enabled ? crypto.randomUUID().slice(0, 8).toUpperCase() : null;
    const { error } = await this.client
      .from('event_config')
      .update({ check_in_enabled: enabled, check_in_code: code })
      .eq('id', 'np-wedding-2026');
    if (error) throw error;
    return code;
  }

  async recordAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId?: string,
    metadata: Record<string, unknown> = {},
  ) {
    const { error } = await this.client.from('host_audit_log').insert({
      host_user_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata,
    });
    if (error) console.error('Host audit log write failed', { action, entityType, entityId });
  }
}

export function createSupabaseRepository() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return new SupabaseRepository(
    createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } }),
  );
}
