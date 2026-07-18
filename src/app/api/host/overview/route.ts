import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { summarizeInvitations } from '@/lib/domain/dashboard';
import { summarizeTables } from '@/lib/domain/tables';
import { jsonError } from '@/lib/http/responses';

export async function GET() {
  try {
    if (!(await getHostSession())) return jsonError(new Error('ไม่ได้รับอนุญาต'), 401);
    const repository = getRepository();
    const [invitations, tables, assignments, checkInCode] = await Promise.all([
      repository.listInvitations(),
      repository.listTables(),
      repository.listTableAssignments(),
      repository.getCheckInCode(),
    ]);
    return Response.json({
      summary: summarizeInvitations(invitations),
      invitations,
      tables: summarizeTables(tables, assignments),
      checkInCode,
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}
