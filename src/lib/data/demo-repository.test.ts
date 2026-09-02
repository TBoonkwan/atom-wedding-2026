import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { listUnassignedAcceptedInvitations } from '@/lib/domain/tables';
import { hashToken } from '@/lib/domain/security';
import { DemoRepository } from './demo-repository';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, {
    force: true,
    recursive: true,
  })));
});

describe('DemoRepository table planning data', () => {
  it('includes an accepted invitation without a table so drag and drop can be tried', async () => {
    const repository = new DemoRepository();

    const unassigned = listUnassignedAcceptedInvitations(
      await repository.listInvitations(),
      await repository.listTableAssignments(),
    );

    expect(unassigned.length).toBeGreaterThan(0);
  });

  it('restores a created guest and invitation token after the demo repository restarts', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'atom-wedding-demo-'));
    temporaryDirectories.push(directory);
    const statePath = join(directory, 'repository.json');
    const token = 'b6ddfbc787517ae3ebd6bd61b2393939';
    const repository = new DemoRepository({ statePath });

    await repository.createInvitations([{
      displayName: 'แขกทดสอบลิงก์',
      contactName: 'คุณทดสอบ',
      phone: '',
      email: '',
      hostNotes: '',
      inviteCode: 'PERSIST',
      tokenHash: hashToken(token),
    }]);
    const persistedState = await readFile(statePath, 'utf8');

    const restartedRepository = new DemoRepository({ statePath });

    expect(persistedState).not.toContain(token);
    expect(persistedState).toContain(hashToken(token));
    await expect(restartedRepository.findInvitationByToken(token)).resolves.toMatchObject({
      displayName: 'แขกทดสอบลิงก์',
      inviteCode: 'PERSIST',
    });
  });
});
