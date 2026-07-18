import { z } from 'zod';
import { getRepository } from '@/lib/data/get-repository';
import { consumePublicRateLimit } from '@/lib/http/distributed-rate-limit';
import { jsonError } from '@/lib/http/responses';
import { selfCheckIn } from '@/lib/services/checkin-service';
import { trustedClientKey } from '@/lib/http/client-key';

const schema = z.object({
  eventCode: z.string().trim().min(4).max(32),
  inviteCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/),
  attendeeCount: z.number().int().min(1).max(300),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const clientKey = trustedClientKey(request, process.env);
    if (
      !(await consumePublicRateLimit(`check-in-client:${clientKey}`, { limit: 30 })) ||
      !(await consumePublicRateLimit(`check-in-code:${input.eventCode}:${input.inviteCode}`, { limit: 10 }))
    ) {
      return jsonError(new Error('ลองเช็กอินใหม่อีกครั้งในอีกสักครู่'), 429);
    }
    const invitation = await selfCheckIn(
      getRepository(),
      input.eventCode,
      input.inviteCode,
      input.attendeeCount,
    );
    return Response.json({
      displayName: invitation.displayName,
      checkedInCount: invitation.checkedInCount,
      tableNumbers: invitation.tableNumbers,
    });
  } catch (error) {
    return jsonError(error);
  }
}
