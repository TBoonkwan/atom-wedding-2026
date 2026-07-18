import { describe, expect, it } from 'vitest';
import { DemoRepository } from './demo-repository';

describe('RSVP history', () => {
  it('records every RSVP change for the host', async () => {
    const repository = new DemoRepository();
    await repository.updateRsvp('demo-1', {
      status: 'accepted', adultCount: 2, childCount: 0, childSeatCount: 0,
      dietaryNotes: '', accessibilityNotes: '', beerPreference: 'ipa',
      songRequest: '', reason: '',
    }, false);

    const history = await repository.listRsvpHistory('demo-1');
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ invitationId: 'demo-1', source: 'guest' });
    expect(history[0].snapshot).toMatchObject({ status: 'accepted', adultCount: 2 });
  });

  it('clears table assignments when a smaller RSVP would over-assign seats', async () => {
    const repository = new DemoRepository();

    await repository.updateRsvp('demo-2', {
      status: 'accepted', adultCount: 2, childCount: 0, childSeatCount: 0,
      dietaryNotes: '', accessibilityNotes: '', beerPreference: 'wheat',
      songRequest: '', reason: '',
    }, false);

    const assignments = await repository.listTableAssignments();
    const invitation = (await repository.listInvitations())
      .find((item) => item.id === 'demo-2');
    expect(assignments).not.toContainEqual(expect.objectContaining({ invitationId: 'demo-2' }));
    expect(invitation?.tableNumbers).toEqual([]);
  });
});
