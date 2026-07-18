import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { jsonError } from '@/lib/http/responses';

export async function GET(
  _request: Request,
  context: RouteContext<'/api/host/invitations/[id]/history'>,
) {
  try {
    if (!(await getHostSession())) return jsonError(new Error('ไม่ได้รับอนุญาต'), 401);
    const { id } = await context.params;
    return Response.json(await getRepository().listRsvpHistory(id));
  } catch (error) {
    return jsonError(error);
  }
}
