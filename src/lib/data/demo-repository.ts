import type { WeddingRepository } from './repository';
import type {
  CheckIn,
  Invitation,
  RsvpInput,
  RsvpHistoryEntry,
  TableAssignment,
  WeddingTable,
  HostAuditLog,
} from '@/lib/domain/types';
import type { NewInvitationRecord } from '@/lib/services/guest-import';
import { hashToken } from '@/lib/domain/security';

const seedInvitations: Invitation[] = [
  {
    id: 'demo-1',
    inviteCode: 'NP2026',
    displayName: 'ครอบครัวเพื่อนเจ้าบ่าว',
    contactName: 'คุณเพื่อน',
    phone: '0800000000',
    hostNotes: 'Demo invitation',
    status: 'pending',
    adultCount: 0,
    childCount: 0,
    childSeatCount: 0,
    dietaryNotes: '',
    accessibilityNotes: '',
    beerPreference: 'none',
    songRequest: '',
    reason: '',
    lateResponse: false,
    checkedInCount: 0,
    tableNumbers: [8],
  },
  {
    id: 'demo-2',
    inviteCode: 'TEA888',
    displayName: 'ครอบครัวใจดี',
    contactName: 'คุณชา',
    status: 'accepted',
    adultCount: 4,
    childCount: 1,
    childSeatCount: 1,
    dietaryNotes: 'ไม่ทานเนื้อ',
    accessibilityNotes: '',
    beerPreference: 'wheat',
    songRequest: 'September',
    reason: '',
    lateResponse: false,
    checkedInCount: 0,
    tableNumbers: [2],
  },
  {
    id: 'demo-3',
    inviteCode: 'BEER99',
    displayName: 'แก๊งคราฟต์เบียร์',
    contactName: 'คุณฮอปส์',
    status: 'accepted',
    adultCount: 8,
    childCount: 0,
    childSeatCount: 0,
    dietaryNotes: '',
    accessibilityNotes: '',
    beerPreference: 'ipa',
    songRequest: 'I Gotta Feeling',
    reason: '',
    lateResponse: true,
    checkedInCount: 5,
    tableNumbers: [12],
  },
  {
    id: 'demo-4',
    inviteCode: 'MAYBE1',
    displayName: 'คุณมะลิและครอบครัว',
    contactName: 'คุณมะลิ',
    status: 'maybe',
    adultCount: 0,
    childCount: 0,
    childSeatCount: 0,
    dietaryNotes: '',
    accessibilityNotes: '',
    beerPreference: 'none',
    songRequest: '',
    reason: 'รอยืนยันตารางเดินทาง',
    lateResponse: false,
    checkedInCount: 0,
    tableNumbers: [],
  },
  {
    id: 'demo-5',
    inviteCode: 'NO2026',
    displayName: 'คุณปอ',
    contactName: 'คุณปอ',
    status: 'rejected',
    adultCount: 0,
    childCount: 0,
    childSeatCount: 0,
    dietaryNotes: '',
    accessibilityNotes: '',
    beerPreference: 'none',
    songRequest: '',
    reason: 'ติดภารกิจต่างประเทศ',
    lateResponse: false,
    checkedInCount: 0,
    tableNumbers: [],
  },
  {
    id: 'demo-6',
    inviteCode: 'DRAG01',
    displayName: 'กลุ่มเพื่อนมหาวิทยาลัย',
    contactName: 'คุณนัท',
    status: 'accepted',
    adultCount: 3,
    childCount: 0,
    childSeatCount: 0,
    dietaryNotes: '',
    accessibilityNotes: '',
    beerPreference: 'none',
    songRequest: '',
    reason: '',
    lateResponse: false,
    checkedInCount: 0,
    tableNumbers: [],
  },
  ...Array.from({ length: 7 }, (_, index): Invitation => ({
    id: `demo-pending-${index + 1}`,
    inviteCode: `WAIT${String(index + 1).padStart(2, '0')}`,
    displayName: `แขกรอตอบรับ ${index + 1}`,
    contactName: `คุณแขก ${index + 1}`,
    status: 'pending',
    adultCount: 0,
    childCount: 0,
    childSeatCount: 0,
    beerPreference: 'none',
    lateResponse: false,
    checkedInCount: 0,
    tableNumbers: [],
  })),
];

export class DemoRepository implements WeddingRepository {
  private invitations = structuredClone(seedInvitations);
  private tokenHashes = new Map<string, string>([['demo-1', hashToken('demo-np-2026')]]);
  private checkIns: CheckIn[] = [];
  private rsvpHistory: RsvpHistoryEntry[] = [];
  private auditLogs: HostAuditLog[] = [];
  private tables = Array.from({ length: 30 }, (_, index): WeddingTable => ({
    id: `table-${index + 1}`,
    number: index + 1,
    capacity: 10,
    revealed: index < 12,
  }));
  private assignments: TableAssignment[] = [
    { invitationId: 'demo-2', tableId: 'table-2', seatCount: 5 },
    { invitationId: 'demo-1', tableId: 'table-8', seatCount: 2 },
    { invitationId: 'demo-3', tableId: 'table-12', seatCount: 8 },
  ];
  private checkInCode: string | null = 'NP-AT-VENUE';

  async findInvitationByToken(token: string) {
    const tokenHash = hashToken(token === 'demo' ? 'demo-np-2026' : token);
    const invitationId = [...this.tokenHashes.entries()].find(([, hash]) => hash === tokenHash)?.[0];
    return this.invitations.find((item) => item.id === invitationId) ?? null;
  }

  async findInvitationByCode(code: string) {
    return this.invitations.find(
      (invitation) => invitation.inviteCode.toLowerCase() === code.trim().toLowerCase(),
    ) ?? null;
  }

  async listInvitations() {
    return structuredClone(this.invitations);
  }

  async listRsvpHistory(invitationId: string) {
    return structuredClone(this.rsvpHistory.filter((item) => item.invitationId === invitationId));
  }

  async updateRsvp(invitationId: string, input: RsvpInput, lateResponse: boolean) {
    const invitation = this.invitations.find((item) => item.id === invitationId);
    if (!invitation) throw new Error('ไม่พบคำเชิญ');

    Object.assign(invitation, input, {
      adultCount: input.status === 'accepted' ? input.adultCount : 0,
      childCount: input.status === 'accepted' ? input.childCount : 0,
      childSeatCount: input.status === 'accepted' ? input.childSeatCount : 0,
      lateResponse,
      updatedAt: new Date().toISOString(),
    });
    this.rsvpHistory.unshift({
      id: `history-${Date.now()}-${this.rsvpHistory.length}`,
      invitationId,
      snapshot: { ...input, lateResponse },
      source: 'guest',
      createdAt: new Date().toISOString(),
    });
    const acceptedPartySize = input.status === 'accepted' ? input.adultCount + input.childCount : 0;
    const assignedSeats = this.assignments
      .filter((item) => item.invitationId === invitationId)
      .reduce((total, item) => total + item.seatCount, 0);
    if (assignedSeats > acceptedPartySize) {
      this.assignments = this.assignments.filter((item) => item.invitationId !== invitationId);
      invitation.tableNumbers = [];
    }
    return structuredClone(invitation);
  }

  async upsertCheckIn(checkIn: CheckIn) {
    const invitation = this.invitations.find((item) => item.id === checkIn.invitationId);
    if (!invitation) throw new Error('ไม่พบคำเชิญ');

    const index = this.checkIns.findIndex((item) => item.invitationId === checkIn.invitationId);
    if (index === -1) this.checkIns.push(checkIn);
    else this.checkIns[index] = checkIn;
    invitation.checkedInCount = checkIn.attendeeCount;
    return structuredClone(invitation);
  }

  async removeCheckIn(invitationId: string) {
    const invitation = this.invitations.find((item) => item.id === invitationId);
    if (!invitation) throw new Error('ไม่พบคำเชิญ');
    this.checkIns = this.checkIns.filter((item) => item.invitationId !== invitationId);
    invitation.checkedInCount = 0;
    return structuredClone(invitation);
  }

  async getCheckInCode() {
    return this.checkInCode;
  }

  async listTables(): Promise<WeddingTable[]> {
    return structuredClone(this.tables);
  }

  async listTableAssignments(): Promise<TableAssignment[]> {
    return structuredClone(this.assignments);
  }

  async createInvitations(records: NewInvitationRecord[]) {
    const created = records.map((record, index): Invitation => ({
      id: `imported-${Date.now()}-${index}`,
      inviteCode: record.inviteCode,
      displayName: record.displayName,
      contactName: record.contactName,
      phone: record.phone || undefined,
      email: record.email || undefined,
      hostNotes: record.hostNotes || undefined,
      status: 'pending',
      adultCount: 0,
      childCount: 0,
      childSeatCount: 0,
      beerPreference: 'none',
      lateResponse: false,
      checkedInCount: 0,
      tableNumbers: [],
    }));
    this.invitations.push(...created);
    created.forEach((invitation, index) => {
      this.tokenHashes.set(invitation.id, records[index].tokenHash);
    });
    return structuredClone(created);
  }

  async updateInvitationDetails(
    invitationId: string,
    details: Pick<Invitation, 'displayName' | 'contactName' | 'phone' | 'email' | 'hostNotes'>,
  ) {
    const invitation = this.invitations.find((item) => item.id === invitationId);
    if (!invitation) throw new Error('ไม่พบคำเชิญ');
    Object.assign(invitation, details);
    return structuredClone(invitation);
  }

  async updateInvitationToken(invitationId: string, tokenHash: string, inviteCode: string) {
    const invitation = this.invitations.find((item) => item.id === invitationId);
    if (!invitation) throw new Error('ไม่พบคำเชิญ');
    this.tokenHashes.set(invitationId, tokenHash);
    invitation.inviteCode = inviteCode;
    return structuredClone(invitation);
  }

  async setTableAssignment(invitationId: string, tableId: string, seatCount: number) {
    const index = this.assignments.findIndex(
      (item) => item.invitationId === invitationId && item.tableId === tableId,
    );
    const assignment = { invitationId, tableId, seatCount };
    if (index === -1) this.assignments.push(assignment);
    else this.assignments[index] = assignment;
  }

  async removeTableAssignment(invitationId: string, tableId: string) {
    this.assignments = this.assignments.filter(
      (item) => item.invitationId !== invitationId || item.tableId !== tableId,
    );
  }

  async setTableRevealed(tableId: string, revealed: boolean) {
    const table = this.tables.find((item) => item.id === tableId);
    if (!table) throw new Error('ไม่พบโต๊ะ');
    table.revealed = revealed;
  }

  async setCheckInEnabled(enabled: boolean) {
    this.checkInCode = enabled ? 'NP-AT-VENUE' : null;
    return this.checkInCode;
  }

  async recordAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId?: string,
    metadata: Record<string, unknown> = {},
  ) {
    this.auditLogs.push({
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      createdAt: new Date().toISOString(),
    });
  }
}
