import { describe, expect, it } from 'vitest';
import { DemoRepository } from '@/lib/data/demo-repository';
import { correctCheckIn } from './host-checkin-service';

describe('correctCheckIn', () => {
  it('lets a host correct the actual attendee count', async () => {
    const repository = new DemoRepository();
    const updated = await correctCheckIn(repository, 'demo-1', 4);

    expect(updated.checkedInCount).toBe(4);
  });

  it('cancels a check-in when the corrected count is zero', async () => {
    const repository = new DemoRepository();
    await correctCheckIn(repository, 'demo-1', 3);
    const updated = await correctCheckIn(repository, 'demo-1', 0);

    expect(updated.checkedInCount).toBe(0);
  });

  it('rejects invalid attendee counts', async () => {
    await expect(correctCheckIn(new DemoRepository(), 'demo-1', -1)).rejects.toThrow(
      'จำนวนผู้เช็กอินไม่ถูกต้อง',
    );
  });
});
