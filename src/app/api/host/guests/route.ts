import { z } from 'zod';
import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { parseGuestCsv } from '@/lib/domain/csv';
import type { GuestImportRow } from '@/lib/domain/csv';
import type { Invitation } from '@/lib/domain/types';
import { jsonError } from '@/lib/http/responses';
import { buildInvitationLinks, prepareGuestInvitations } from '@/lib/services/guest-import';

const updateSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.email(), z.literal('')]).optional(),
  hostNotes: z.string().trim().max(500).optional(),
});

const guestSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40).optional().default(''),
  email: z.union([z.email(), z.literal('')]).optional().default(''),
  hostNotes: z.string().trim().max(500).optional().default(''),
});

const createSchema = z.union([
  z.object({ csv: z.string().min(1).max(1_000_000) }),
  z.object({ guest: guestSchema }),
]);

function duplicateErrors(rows: GuestImportRow[], existing: Invitation[]) {
  return rows.flatMap((row, index) => {
    const duplicate = existing.some((invitation) =>
      (row.email && invitation.email?.toLowerCase() === row.email.toLowerCase()) ||
      (row.phone && invitation.phone?.replace(/\D/g, '') === row.phone.replace(/\D/g, '')),
    );
    if (!duplicate) return [];
    const prefix = rows.length > 1 ? `แถว ${index + 2}: ` : '';
    return [`${prefix}email หรือโทรศัพท์มีอยู่ในระบบแล้ว`];
  });
}

async function authorize() {
  const session = await getHostSession();
  if (!session) throw new Error('ไม่ได้รับอนุญาต');
  return session;
}

export async function GET() {
  try {
    await authorize();
    return Response.json(await getRepository().listInvitations());
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const session = await authorize();
    const input = createSchema.parse(await request.json());
    let rows: GuestImportRow[];
    if ('csv' in input) {
      const parsed = parseGuestCsv(input.csv);
      if (parsed.errors.length > 0) return Response.json(parsed, { status: 422 });
      rows = parsed.rows;
    } else {
      rows = [input.guest];
    }
    const repository = getRepository();
    const existing = await repository.listInvitations();
    const duplicates = duplicateErrors(rows, existing);
    if (duplicates.length > 0) return Response.json({ rows: [], errors: duplicates }, { status: 422 });
    const prepared = prepareGuestInvitations(
      rows,
      undefined,
      existing.map((invitation) => invitation.inviteCode),
    );
    const invitations = await repository.createInvitations(prepared.map((item) => item.record));
    const singleGuest = 'guest' in input;
    await repository.recordAudit(
      session.id,
      singleGuest ? 'guest_create' : 'guest_import',
      'invitation',
      singleGuest ? invitations[0]?.id : undefined,
      {
      count: invitations.length,
      },
    );
    return Response.json({
      imported: invitations.length,
      links: buildInvitationLinks(prepared),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await authorize();
    const input = updateSchema.parse(await request.json());
    const repository = getRepository();
    const invitation = await repository.updateInvitationDetails(input.id, {
        displayName: input.displayName,
        contactName: input.contactName,
        phone: input.phone,
        email: input.email,
        hostNotes: input.hostNotes,
      });
    await repository.recordAudit(session.id, 'guest_update', 'invitation', input.id);
    return Response.json(invitation);
  } catch (error) {
    return jsonError(error);
  }
}
