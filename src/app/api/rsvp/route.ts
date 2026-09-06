import { getRepository } from '@/lib/data/get-repository';
import { consumePublicRateLimit } from '@/lib/http/distributed-rate-limit';
import { trustedClientKey } from '@/lib/http/client-key';
import { jsonError } from '@/lib/http/responses';
import { submitPublicRsvp } from '@/lib/services/public-rsvp-service';

export async function POST(request: Request) {
  try {
    const clientKey = trustedClientKey(request, process.env);
    if (!(await consumePublicRateLimit(`public-rsvp:${clientKey}`, { limit: 20 }))) {
      return jsonError(new Error('ส่งข้อมูลบ่อยเกินไป กรุณารอสักครู่'), 429);
    }
    return Response.json(await submitPublicRsvp(getRepository(), await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
