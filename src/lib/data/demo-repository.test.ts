import { describe, expect, it } from 'vitest';
import { listUnassignedAcceptedInvitations } from '@/lib/domain/tables';
import { DemoRepository } from './demo-repository';

describe('DemoRepository table planning data', () => {
  it('includes an accepted invitation without a table so drag and drop can be tried', async () => {
    const repository = new DemoRepository();

    const unassigned = listUnassignedAcceptedInvitations(
      await repository.listInvitations(),
      await repository.listTableAssignments(),
    );

    expect(unassigned.length).toBeGreaterThan(0);
  });
});
