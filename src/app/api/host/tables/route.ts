import { z } from 'zod';
import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { summarizeTables, validateSeatAssignment } from '@/lib/domain/tables';
import { jsonError } from '@/lib/http/responses';

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('assign'),
    invitationId: z.string().min(1),
    tableId: z.string().min(1),
    seatCount: z.number().int().min(1).max(300),
  }),
  z.object({
    action: z.literal('reveal'),
    tableId: z.string().min(1),
    revealed: z.boolean(),
  }),
  z.object({
    action: z.literal('remove'),
    invitationId: z.string().min(1),
    tableId: z.string().min(1),
  }),
]);

export async function GET() {
  if (!(await getHostSession())) return jsonError(new Error('ไม่ได้รับอนุญาต'), 401);
  const repository = getRepository();
  return Response.json(
    summarizeTables(await repository.listTables(), await repository.listTableAssignments()),
  );
}

export async function POST(request: Request) {
  try {
    const session = await getHostSession();
    if (!session) return jsonError(new Error('ไม่ได้รับอนุญาต'), 401);
    const input = schema.parse(await request.json());
    const repository = getRepository();
    if (input.action === 'assign') {
      const [invitations, assignments] = await Promise.all([
        repository.listInvitations(),
        repository.listTableAssignments(),
      ]);
      const invitation = invitations.find((item) => item.id === input.invitationId);
      if (!invitation) throw new Error('ไม่พบ invitation');
      const validationError = validateSeatAssignment(
        invitation, assignments, input.tableId, input.seatCount,
      );
      if (validationError) throw new Error(validationError);
      await repository.setTableAssignment(input.invitationId, input.tableId, input.seatCount);
    } else if (input.action === 'remove') {
      await repository.removeTableAssignment(input.invitationId, input.tableId);
    } else {
      await repository.setTableRevealed(input.tableId, input.revealed);
    }
    await repository.recordAudit(session.id, `table_${input.action}`, 'wedding_table', input.tableId, input);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
