import { describe, expect, it, vi } from 'vitest';
import { DemoRepository } from '@/lib/data/demo-repository';
import { selfCheckIn } from './checkin-service';

describe('selfCheckIn', () => {
  it('requires the active venue code', async () => {
    const repository = new DemoRepository();

    await expect(selfCheckIn(repository, 'WRONG', 'NP2026', 2)).rejects.toThrow(
      'QR เช็กอินยังไม่เปิดใช้งาน',
    );
  });

  it('rejects invite-code wildcard characters before repository lookup', async () => {
    await expect(selfCheckIn(new DemoRepository(), 'NP-AT-VENUE', '%EA888', 1)).rejects.toThrow(
      'รหัสคำเชิญไม่ถูกต้อง',
    );
  });

  it('is idempotent for the same invitation', async () => {
    const repository = new DemoRepository();

    await selfCheckIn(repository, 'NP-AT-VENUE', 'TEA888', 2);
    const updated = await selfCheckIn(repository, 'NP-AT-VENUE', 'TEA888', 3);

    expect(updated.checkedInCount).toBe(3);
    expect((await repository.listInvitations()).find((item) => item.inviteCode === 'TEA888')?.checkedInCount).toBe(3);
  });

  it('requires an accepted RSVP and caps arrivals to the accepted party size', async () => {
    const repository = new DemoRepository();

    await expect(selfCheckIn(repository, 'NP-AT-VENUE', 'NP2026', 1)).rejects.toThrow(
      'ยังไม่ได้ตอบรับเข้าร่วมงาน',
    );
    await expect(selfCheckIn(repository, 'NP-AT-VENUE', 'TEA888', 6)).rejects.toThrow(
      'เกินจำนวนที่ตอบรับไว้',
    );
  });

  it('returns all assigned tables after check-in regardless of reveal state', async () => {
    const repository = new DemoRepository();
    await repository.setTableAssignment('demo-2', 'table-13', 1);
    const assignments = await repository.listTableAssignments();
    vi.spyOn(repository, 'listTableAssignments').mockResolvedValue([
      ...assignments,
      { invitationId: 'demo-2', tableId: 'table-13', seatCount: 1 },
    ]);

    const updated = await selfCheckIn(repository, 'NP-AT-VENUE', 'TEA888', 2);

    expect(updated.tableNumbers).toEqual([2, 13]);
  });

  it('returns no table numbers when the checked-in invitation is unassigned', async () => {
    const repository = new DemoRepository();

    const updated = await selfCheckIn(repository, 'NP-AT-VENUE', 'DRAG01', 3);

    expect(updated.tableNumbers).toEqual([]);
  });
});
