import { describe, expect, it } from 'vitest';
import { jsonError } from './responses';

describe('jsonError', () => {
  it('does not expose unexpected database or configuration messages', async () => {
    const response = jsonError(new Error('relation invitations does not exist'), 500);
    await expect(response.json()).resolves.toEqual({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  });

  it('keeps intentional Thai user-facing validation messages', async () => {
    const response = jsonError(new Error('ไม่พบคำเชิญนี้'), 404);
    await expect(response.json()).resolves.toEqual({ error: 'ไม่พบคำเชิญนี้' });
  });
});
