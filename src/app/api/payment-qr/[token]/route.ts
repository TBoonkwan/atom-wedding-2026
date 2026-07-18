import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseMode } from '@/lib/auth/supabase-config';
import { getRepository } from '@/lib/data/get-repository';
import { jsonError } from '@/lib/http/responses';
import { getPublicInvitation } from '@/lib/services/invitation-service';
import { consumePublicRateLimit } from '@/lib/http/distributed-rate-limit';
import { trustedClientKey } from '@/lib/http/client-key';

async function loadPaymentQrImage() {
  if (getSupabaseMode(process.env) === 'configured') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.storage.from('payment-qr').download('payment-qr.png');
    if (error || !data) throw error ?? new Error('ไม่พบ QR ซองออนไลน์');
    return Buffer.from(await data.arrayBuffer());
  }

  return readFile(join(process.cwd(), 'private', 'payment-qr.png'));
}

export async function GET(request: Request, context: RouteContext<'/api/payment-qr/[token]'>) {
  try {
    const { token } = await context.params;
    const clientKey = trustedClientKey(request, process.env);
    if (
      !(await consumePublicRateLimit(`payment-read-client:${clientKey}`, { limit: 60 })) ||
      !(await consumePublicRateLimit(`payment-read-token:${token}`, { limit: 30 }))
    ) return jsonError(new Error('เรียกข้อมูลบ่อยเกินไป กรุณารอสักครู่'), 429);
    await getPublicInvitation(getRepository(), token);
    const image = await loadPaymentQrImage();
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
