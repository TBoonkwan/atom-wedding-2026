import { z } from 'zod';
import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { jsonError } from '@/lib/http/responses';

export async function POST(request: Request) {
  try {
    const session = await getHostSession();
    if (!session) return jsonError(new Error('ไม่ได้รับอนุญาต'), 401);
    const { enabled } = z.object({ enabled: z.boolean() }).parse(await request.json());
    const repository = getRepository();
    const code = await repository.setCheckInEnabled(enabled);
    await repository.recordAudit(session.id, enabled ? 'check_in_opened' : 'check_in_closed', 'event_config', 'np-wedding-2026');
    return Response.json({ enabled, code });
  } catch (error) {
    return jsonError(error);
  }
}
