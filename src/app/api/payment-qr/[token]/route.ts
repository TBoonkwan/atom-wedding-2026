import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getRepository } from '@/lib/data/get-repository';
import { jsonError } from '@/lib/http/responses';
import { getPublicInvitation } from '@/lib/services/invitation-service';
import { consumePublicRateLimit } from '@/lib/http/distributed-rate-limit';
import { trustedClientKey } from '@/lib/http/client-key';

export async function GET(request: Request, context: RouteContext<'/api/payment-qr/[token]'>) {
  try {
    const { token } = await context.params;
    const clientKey = trustedClientKey(request, process.env);
    if (
      !(await consumePublicRateLimit(`payment-read-client:${clientKey}`, { limit: 60 })) ||
      !(await consumePublicRateLimit(`payment-read-token:${token}`, { limit: 30 }))
    ) return jsonError(new Error('เรียกข้อมูลบ่อยเกินไป กรุณารอสักครู่'), 429);
    await getPublicInvitation(getRepository(), token);
    const image = await readFile(join(process.cwd(), 'private', 'payment-qr.png'));
    return new Response(image, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    return jsonError(error, 404);
  }
}
