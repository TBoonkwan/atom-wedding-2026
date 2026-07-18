import { getRepository } from '@/lib/data/get-repository';
import { consumePublicRateLimit } from '@/lib/http/distributed-rate-limit';
import { jsonError } from '@/lib/http/responses';
import { getPublicInvitation, submitRsvp } from '@/lib/services/invitation-service';
import { trustedClientKey } from '@/lib/http/client-key';

export async function GET(request: Request, context: RouteContext<'/api/invitations/[token]'>) {
  try {
    const { token } = await context.params;
    const clientKey = trustedClientKey(request, process.env);
    if (
      !(await consumePublicRateLimit(`invitation-read-client:${clientKey}`, { limit: 120 })) ||
      !(await consumePublicRateLimit(`invitation-read-token:${token}`, { limit: 60 }))
    ) return jsonError(new Error('เรียกข้อมูลบ่อยเกินไป กรุณารอสักครู่'), 429);
    return Response.json(await getPublicInvitation(getRepository(), token));
  } catch (error) {
    return jsonError(error, 404);
  }
}

export async function POST(request: Request, context: RouteContext<'/api/invitations/[token]'>) {
  try {
    const { token } = await context.params;
    const clientKey = trustedClientKey(request, process.env);
    if (
      !(await consumePublicRateLimit(`rsvp-client:${clientKey}`, { limit: 60 })) ||
      !(await consumePublicRateLimit(`rsvp-invitation:${token}`, { limit: 20 }))
    ) {
      return jsonError(new Error('ส่งข้อมูลบ่อยเกินไป กรุณารอสักครู่'), 429);
    }
    const input = await request.json();
    return Response.json(await submitRsvp(getRepository(), token, input));
  } catch (error) {
    return jsonError(error);
  }
}
