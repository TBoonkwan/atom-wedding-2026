import { createWeddingIcs } from '@/lib/domain/calendar';
import { getRepository } from '@/lib/data/get-repository';
import { jsonError } from '@/lib/http/responses';
import { getPublicInvitation } from '@/lib/services/invitation-service';
import { consumePublicRateLimit } from '@/lib/http/distributed-rate-limit';
import { trustedClientKey } from '@/lib/http/client-key';

export async function GET(request: Request, context: RouteContext<'/api/calendar/[token]'>) {
  try {
    const { token: tokenWithExtension } = await context.params;
    const token = tokenWithExtension.endsWith('.ics')
      ? tokenWithExtension.slice(0, -4)
      : tokenWithExtension;
    const clientKey = trustedClientKey(request, process.env);
    if (
      !(await consumePublicRateLimit(`calendar-read-client:${clientKey}`, { limit: 60 })) ||
      !(await consumePublicRateLimit(`calendar-read-token:${token}`, { limit: 20 }))
    ) return jsonError(new Error('เรียกข้อมูลบ่อยเกินไป กรุณารอสักครู่'), 429);
    await getPublicInvitation(getRepository(), token);
    const body = createWeddingIcs(token);
    return new Response(body, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="nathapol-pennisut-wedding.ics"',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    return jsonError(error, 404);
  }
}
