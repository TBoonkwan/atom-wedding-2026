import { z } from 'zod';
import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { parseGuestCsv } from '@/lib/domain/csv';
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
    const { csv } = z.object({ csv: z.string().min(1).max(1_000_000) }).parse(await request.json());
    const parsed = parseGuestCsv(csv);
    if (parsed.errors.length > 0) return Response.json(parsed, { status: 422 });
    const repository = getRepository();
    const existing = await repository.listInvitations();
    const duplicates = parsed.rows.flatMap((row, index) => {
      const duplicate = existing.some((invitation) =>
        (row.email && invitation.email?.toLowerCase() === row.email.toLowerCase()) ||
        (row.phone && invitation.phone?.replace(/\D/g, '') === row.phone.replace(/\D/g, '')),
      );
      return duplicate ? [`แถว ${index + 2}: email หรือโทรศัพท์มีอยู่ในระบบแล้ว`] : [];
    });
    if (duplicates.length > 0) return Response.json({ rows: [], errors: duplicates }, { status: 422 });
    const prepared = prepareGuestInvitations(
      parsed.rows,
      undefined,
      existing.map((invitation) => invitation.inviteCode),
    );
    const invitations = await repository.createInvitations(prepared.map((item) => item.record));
    await repository.recordAudit(session.id, 'guest_import', 'invitation', undefined, {
      count: invitations.length,
    });
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
