import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DemoRepository } from '@/lib/data/demo-repository';
const state = vi.hoisted(() => ({ repository: null as unknown, allowed: true }));
vi.mock('@/lib/data/get-repository', () => ({ getRepository: () => state.repository }));
vi.mock('@/lib/http/distributed-rate-limit', () => ({ consumePublicRateLimit: async () => state.allowed }));
import { POST } from './route';
import { POST as checkIn } from '../check-ins/route';

const input = { name: 'คุณใหม่', submissionId: 'ea13b6ce-c6bd-40c8-8aee-c4a6ac857e10', status: 'accepted', adultCount: 1, childCount: 0, childSeatCount: 0, dietaryNotes: '', accessibilityNotes: '', beerPreference: 'none', songRequest: '', reason: '' };
const request = (body: unknown) => new Request('https://wedding.test/api/rsvp', { method: 'POST', body: JSON.stringify(body) });
afterEach(() => vi.useRealTimers());
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-05T00:00:00Z')); state.repository = new DemoRepository(); state.allowed = true; });
it('accepts a name-only RSVP without authentication and persists the response', async () => {
  const response = await POST(request(input));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ displayName: 'คุณใหม่', status: 'accepted', adultCount: 1 });
  expect((await (state.repository as DemoRepository).listInvitations()).find(x => x.displayName === 'คุณใหม่')).toMatchObject({ status: 'accepted' });
});
it('returns a validation error and does not create a guest with an empty name', async () => {
  const repo = state.repository as DemoRepository;
  const count = (await repo.listInvitations()).length;
  expect((await POST(request({ ...input, name: ' ' }))).status).toBe(400);
  expect(await repo.listInvitations()).toHaveLength(count);
});
it('blocks a rate-limited request without writing a guest', async () => {
  state.allowed = false;
  expect((await POST(request(input))).status).toBe(429);
  expect((await (state.repository as DemoRepository).listInvitations()).some(x => x.displayName === 'คุณใหม่')).toBe(false);
});
it('retires event check-in', async () => {
  expect((await checkIn()).status).toBe(410);
});
