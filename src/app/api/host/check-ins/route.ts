import { z } from 'zod';
import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { jsonError } from '@/lib/http/responses';
import { correctCheckIn } from '@/lib/services/host-checkin-service';

const correctionSchema = z.object({
  invitationId: z.string().min(1),
  attendeeCount: z.number().int().min(0).max(300),
});

export async function POST(request: Request) {
  try {
    const session = await getHostSession();
    if (!session) return jsonError(new Error('ไม่ได้รับอนุญาต'), 401);
    const input = correctionSchema.parse(await request.json());
    const repository = getRepository();
    const invitation = await correctCheckIn(
      repository, input.invitationId, input.attendeeCount, session.id,
    );
    await repository.recordAudit(session.id, 'check_in_correction', 'invitation', input.invitationId, {
      attendeeCount: input.attendeeCount,
    });
    return Response.json(invitation);
  } catch (error) {
    return jsonError(error);
  }
}
