import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { jsonError } from '@/lib/http/responses';
import { rotateInvitationLink } from '@/lib/services/invitation-link-service';

export async function POST(
  _request: Request,
  context: RouteContext<'/api/host/invitations/[id]/rotate-token'>,
) {
  try {
    const session = await getHostSession();
    if (!session) return jsonError(new Error('ไม่ได้รับอนุญาต'), 401);
    const { id } = await context.params;
    const repository = getRepository();
    const result = await rotateInvitationLink(repository, id);
    await repository.recordAudit(session.id, 'invitation_token_rotated', 'invitation', id);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
