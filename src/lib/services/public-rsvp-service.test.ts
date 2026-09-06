import { expect, it } from 'vitest';
import { DemoRepository } from '@/lib/data/demo-repository';
import { submitPublicRsvp } from './public-rsvp-service';

const input = { name: '  คุณเอ  ', submissionId: 'ce07fef0-70aa-4c0c-81ac-d712e8942e43', status: 'accepted', adultCount: 2, childCount: 1, childSeatCount: 1, dietaryNotes: 'แพ้ถั่ว', accessibilityNotes: '', beerPreference: 'none', songRequest: '', reason: '' };
const now = new Date('2026-09-05T00:00:00Z');
it('saves a named public response and makes it visible to the host without a prior invitation', async () => {
  const repo = new DemoRepository();
  await submitPublicRsvp(repo, input, now);
  expect((await repo.listInvitations()).find(x => x.displayName === 'คุณเอ')).toMatchObject({ contactName: 'คุณเอ', status: 'accepted', adultCount: 2, childCount: 1, dietaryNotes: 'แพ้ถั่ว', checkedInCount: 0 });
});
it('retries a submission without duplicating it and keeps different people with the same name separate', async () => {
  const repo = new DemoRepository();
  const count = (await repo.listInvitations()).length;
  await submitPublicRsvp(repo, input, now);
  await submitPublicRsvp(repo, input, now);
  expect(await repo.listInvitations()).toHaveLength(count + 1);
  await submitPublicRsvp(repo, { ...input, submissionId: 'c20586ae-f00b-4711-8d02-48e47ae8d886' }, now);
  expect(await repo.listInvitations()).toHaveLength(count + 2);
});
it.each([{ name: '  ' }, { adultCount: -1 }, { submissionId: 'bad' }])('rejects invalid input before creating a guest: %j', async bad => {
  const repo = new DemoRepository();
  const count = (await repo.listInvitations()).length;
  await expect(submitPublicRsvp(repo, { ...input, ...bad }, now)).rejects.toThrow();
  expect(await repo.listInvitations()).toHaveLength(count);
});
it('does not count a declined party and rejects responses after the cutoff', async () => {
  const repo = new DemoRepository();
  await submitPublicRsvp(repo, { ...input, status: 'rejected', reason: 'ติดเดินทาง' }, now);
  expect((await repo.listInvitations()).find(x => x.displayName === 'คุณเอ')).toMatchObject({ status: 'rejected', adultCount: 0, childCount: 0, childSeatCount: 0, reason: 'ติดเดินทาง' });
  await expect(submitPublicRsvp(repo, input, new Date('2027-01-01'))).rejects.toThrow();
});
it('creates only one response when identical submissions arrive concurrently', async () => {
  const repo = new DemoRepository();
  const count = (await repo.listInvitations()).length;
  await Promise.all([submitPublicRsvp(repo, input, now), submitPublicRsvp(repo, input, now)]);
  expect(await repo.listInvitations()).toHaveLength(count + 1);
});
it('records the first response in host RSVP history', async () => {
  const repo = new DemoRepository();
  await submitPublicRsvp(repo, input, now);
  const guest = (await repo.listInvitations()).find(x => x.displayName === 'คุณเอ')!;
  expect(await repo.listRsvpHistory(guest.id)).toEqual([expect.objectContaining({ source: 'guest', snapshot: expect.objectContaining({ status: 'accepted', adultCount: 2 }) })]);
});
