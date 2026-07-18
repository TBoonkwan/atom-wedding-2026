import type { WeddingRepository } from '@/lib/data/repository';

export async function selfCheckIn(
  repository: WeddingRepository,
  eventCode: string,
  inviteCode: string,
  attendeeCount: number,
) {
  const activeCode = await repository.getCheckInCode();
  if (!activeCode || eventCode !== activeCode) {
    throw new Error('QR เช็กอินยังไม่เปิดใช้งาน');
  }
  if (!Number.isInteger(attendeeCount) || attendeeCount < 1 || attendeeCount > 300) {
    throw new Error('จำนวนผู้ร่วมงานไม่ถูกต้อง');
  }
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(normalizedInviteCode)) throw new Error('รหัสคำเชิญไม่ถูกต้อง');
  const invitation = await repository.findInvitationByCode(normalizedInviteCode);
  if (!invitation) throw new Error('ไม่พบรหัสคำเชิญ');
  if (invitation.status !== 'accepted') throw new Error('คำเชิญนี้ยังไม่ได้ตอบรับเข้าร่วมงาน');
  if (attendeeCount > invitation.adultCount + invitation.childCount) {
    throw new Error('จำนวนผู้มาเช็กอินเกินจำนวนที่ตอบรับไว้ กรุณาติดต่อทีมงาน');
  }

  const checkedIn = await repository.upsertCheckIn({
    invitationId: invitation.id,
    attendeeCount,
    checkedInAt: new Date().toISOString(),
  });
  const [tables, assignments] = await Promise.all([
    repository.listTables(),
    repository.listTableAssignments(),
  ]);
  const tableNumberById = new Map(tables.map((table) => [table.id, table.number]));
  const tableNumbers = [
    ...new Set(
      assignments
        .filter((assignment) => assignment.invitationId === invitation.id)
        .map((assignment) => tableNumberById.get(assignment.tableId))
        .filter((number): number is number => number !== undefined),
    ),
  ].sort((left, right) => left - right);

  return { ...checkedIn, tableNumbers };
}
