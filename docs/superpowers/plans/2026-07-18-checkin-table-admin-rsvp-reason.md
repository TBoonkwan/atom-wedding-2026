# Check-in Table and Admin RSVP Reason Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show every assigned table after successful self check-in, make non-attendance RSVP reasons optional, and display current reasons in the Admin guest table.

**Architecture:** Keep public invitation table visibility unchanged and resolve all assigned table numbers only inside the successful self-check-in service path. Reuse the existing `Invitation.reason` field and overview payload; change validation/form behavior to optional and add a status-aware presentation helper in the Admin dashboard.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Zod 4.4.3, Vitest 4.1.10, Testing Library, CSS.

## Global Constraints

- Follow the checked-in Next.js 16 guides under `node_modules/next/dist/docs/`; the relevant Route Handler and Server/Client Component guides have been reviewed.
- Do not add dependencies or change the database schema.
- The public invitation page continues to show only tables whose `revealed` flag is true.
- A successful self check-in returns every current assignment for that invitation, regardless of `revealed`.
- The reason is optional for `maybe` and `rejected`, absent for `accepted`, and limited to 500 trimmed characters.
- The Admin reason column shows `—` for accepted, pending, or empty optional reasons.
- Use test-driven development and observe each new behavior test fail for the intended reason before editing production code.

---

## File Map

- `src/lib/domain/rsvp.test.ts` and `src/lib/domain/rsvp.ts`: authoritative optional-reason validation.
- `src/components/invitation/rsvp-form.test.tsx` and `src/components/invitation/rsvp-form.tsx`: optional UI and stale-reason clearing.
- `src/lib/services/checkin-service.test.ts` and `src/lib/services/checkin-service.ts`: all assigned table numbers after successful check-in.
- `src/components/checkin/checkin-form.test.tsx`: assigned-table and unassigned fallback rendering coverage.
- `src/components/host/host-dashboard.test.tsx` and `src/components/host/host-dashboard.tsx`: Admin reason column.
- `src/app/globals.css`: constrained wrapping for long reason text.

### Task 1: Make RSVP Reasons Optional

**Files:**
- Modify: `src/lib/domain/rsvp.test.ts`
- Modify: `src/lib/domain/rsvp.ts`
- Modify: `src/components/invitation/rsvp-form.test.tsx`
- Modify: `src/components/invitation/rsvp-form.tsx`

**Interfaces:**
- Consumes: `validateRsvp(input: unknown)` and `RsvpInput.reason: string`.
- Produces: validation accepting `reason: ''` for every status; `RsvpForm` submits an empty reason for `accepted` and optional text for `maybe`/`rejected`.

- [ ] **Step 1: Replace the domain requirement test with optional and maximum-length cases**

In `src/lib/domain/rsvp.test.ts`, replace `requires a reason for %s responses` with:

```ts
  it.each(['maybe', 'rejected'] as const)(
    'accepts an empty optional reason for %s responses',
    (status) => {
      const result = validateRsvp({
        status,
        adultCount: 0,
        childCount: 0,
        childSeatCount: 0,
        dietaryNotes: '',
        accessibilityNotes: '',
        beerPreference: 'none',
        songRequest: '',
        reason: '  ',
      });
      expect(result.success).toBe(true);
    },
  );

  it('keeps the 500-character limit for an optional reason', () => {
    const result = validateRsvp({
      status: 'maybe',
      adultCount: 0,
      childCount: 0,
      childSeatCount: 0,
      dietaryNotes: '',
      accessibilityNotes: '',
      beerPreference: 'none',
      songRequest: '',
      reason: 'ก'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
```

- [ ] **Step 2: Verify the optional domain case fails**

Run `npm test -- src/lib/domain/rsvp.test.ts`.

Expected: FAIL because empty `maybe` and `rejected` reasons still receive `กรุณาบอกเหตุผลสั้น ๆ ให้เราทราบ`; the 501-character assertion remains valid.

- [ ] **Step 3: Remove only the non-empty domain requirement**

Delete this block from `src/lib/domain/rsvp.ts`, leaving `reason: z.string().trim().max(500)` intact:

```ts
    if (value.status !== 'accepted' && value.reason.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'กรุณาบอกเหตุผลสั้น ๆ ให้เราทราบ',
        path: ['reason'],
      });
    }
```

- [ ] **Step 4: Verify the domain tests pass**

Run `npm test -- src/lib/domain/rsvp.test.ts`.

Expected: PASS; blank reasons are accepted and 501 characters are rejected.

- [ ] **Step 5: Replace the form requirement test and cover stale-reason clearing**

In `src/components/invitation/rsvp-form.test.tsx`, replace the current reason-required test with:

```tsx
  it.each([
    ['ยังไม่แน่ใจ', 'maybe'],
    ['ไปไม่ได้', 'rejected'],
  ] as const)('submits an optional empty reason for %s', async (choice, status) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<RsvpForm token="demo" onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: choice }));
    expect(screen.getByLabelText('บอกเหตุผลให้เราทราบ')).not.toBeRequired();
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({ status, reason: '' });
  });

  it('clears a previous reason when the guest changes to attending', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <RsvpForm
        token="changed-response"
        initial={{
          ...DEMO_PUBLIC_INVITATION,
          status: 'maybe',
          adultCount: 0,
          childCount: 0,
          reason: 'รอเช็กตารางงาน',
        }}
        onSaved={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'ไปร่วมงาน' }));
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({ status: 'accepted', reason: '' });
  });
```

- [ ] **Step 6: Verify the form tests fail for the intended reasons**

Run `npm test -- src/components/invitation/rsvp-form.test.tsx`.

Expected: FAIL because the textarea remains required, blank reasons are blocked before `fetch`, and selecting `accepted` preserves the old reason.

- [ ] **Step 7: Implement optional form submission**

In `src/components/invitation/rsvp-form.tsx`, add below `setNumber`:

```ts
  function setStatus(status: RsvpInput['status']) {
    setInput((current) => ({
      ...current,
      status,
      reason: status === 'accepted' ? '' : current.reason,
    }));
  }
```

Delete the blank-reason early return in `submit`, change the choice handler to `onClick={() => setStatus(status)}`, and replace the textarea with:

```tsx
          <label>บอกเหตุผลให้เราทราบ (ไม่บังคับ)<textarea aria-label="บอกเหตุผลให้เราทราบ" value={input.reason} onChange={(event) => setInput((current) => ({ ...current, reason: event.target.value }))} /></label>
```

- [ ] **Step 8: Verify domain and form behavior together**

Run `npm test -- src/lib/domain/rsvp.test.ts src/components/invitation/rsvp-form.test.tsx`.

Expected: PASS with no warnings or errors.

- [ ] **Step 9: Commit Task 1**

```bash
git add src/lib/domain/rsvp.ts src/lib/domain/rsvp.test.ts src/components/invitation/rsvp-form.tsx src/components/invitation/rsvp-form.test.tsx
git commit -m "feat: make RSVP reasons optional"
```

### Task 2: Return Every Assigned Table After Self Check-in

**Files:**
- Modify: `src/lib/services/checkin-service.test.ts`
- Modify: `src/lib/services/checkin-service.ts`
- Modify: `src/components/checkin/checkin-form.test.tsx`

**Interfaces:**
- Consumes: `WeddingRepository.listTables()`, `listTableAssignments()`, and `upsertCheckIn()`.
- Produces: `selfCheckIn(...): Promise<Invitation>` whose `tableNumbers` contains sorted unique numbers for every current assignment after a successful write.

- [ ] **Step 1: Add hidden, multiple, duplicate, and missing assignment coverage**

Include `vi` in the Vitest import in `src/lib/services/checkin-service.test.ts`, then add:

```ts
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
```

Table 13 is unrevealed in `DemoRepository`; the duplicate mock proves deduplication and existing table 2 proves ascending multi-table output.

- [ ] **Step 2: Verify the hidden-table service test fails**

Run `npm test -- src/lib/services/checkin-service.test.ts`.

Expected: FAIL because the returned invitation contains table 2 but not newly assigned unrevealed table 13. The unassigned case passes.

- [ ] **Step 3: Resolve assignments after the successful write**

Replace the direct `return repository.upsertCheckIn(...)` in `src/lib/services/checkin-service.ts` with:

```ts
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
```

Do not inspect `WeddingTable.revealed` in this service path.

- [ ] **Step 4: Verify service tests pass**

Run `npm test -- src/lib/services/checkin-service.test.ts`.

Expected: PASS including existing validation and idempotency cases.

- [ ] **Step 5: Add client coverage for the existing success rendering**

In `src/components/checkin/checkin-form.test.tsx`, import `fireEvent`, `afterEach`, and `vi`; add cleanup with `vi.restoreAllMocks()` and `vi.unstubAllGlobals()`. Add:

```tsx
  it('shows every assigned table returned by a successful check-in', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        displayName: 'ครอบครัวใจดี', checkedInCount: 2, tableNumbers: [2, 13],
      }),
    }));
    render(<CheckInForm eventCode="NP-AT-VENUE" />);
    fireEvent.change(screen.getByLabelText('รหัสคำเชิญ 6 ตัว'), { target: { value: 'TEA888' } });
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันเช็กอิน' }));
    expect(await screen.findByText('โต๊ะ 2, 13')).toBeInTheDocument();
  });

  it('keeps the staff fallback when no table is assigned', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        displayName: 'กลุ่มเพื่อนมหาวิทยาลัย', checkedInCount: 3, tableNumbers: [],
      }),
    }));
    render(<CheckInForm eventCode="NP-AT-VENUE" />);
    fireEvent.change(screen.getByLabelText('รหัสคำเชิญ 6 ตัว'), { target: { value: 'DRAG01' } });
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันเช็กอิน' }));
    expect(await screen.findByText('ทีมงานจะแจ้งโต๊ะให้ทราบอีกครั้ง')).toBeInTheDocument();
  });
```

- [ ] **Step 6: Verify the complete check-in slice**

Run `npm test -- src/lib/services/checkin-service.test.ts src/components/checkin/checkin-form.test.tsx`.

Expected: PASS. The component tests characterize existing rendering; the service test supplies the new hidden-assignment behavior.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/lib/services/checkin-service.ts src/lib/services/checkin-service.test.ts src/components/checkin/checkin-form.test.tsx
git commit -m "feat: reveal assigned tables after check-in"
```

### Task 3: Show Optional Reasons in the Admin Guest Table

**Files:**
- Modify: `src/components/host/host-dashboard.test.tsx`
- Modify: `src/components/host/host-dashboard.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing `Invitation.status` and `Invitation.reason` returned by `/api/host/overview`.
- Produces: `reasonForGuest(invitation: Invitation): string` and a `เหตุผล` guest-table column.

- [ ] **Step 1: Add Admin table behavior coverage**

Update `src/components/host/host-dashboard.test.tsx` imports to include `waitFor`, `within`, `afterEach`, and `Invitation`. Add:

```tsx
const guest = (overrides: Partial<Invitation>): Invitation => ({
  id: 'guest-1', inviteCode: 'AAA111', displayName: 'คุณเอ', contactName: 'คุณเอ',
  status: 'pending', adultCount: 0, childCount: 0, childSeatCount: 0,
  beerPreference: 'none', lateResponse: false, checkedInCount: 0, tableNumbers: [],
  ...overrides,
});
```

Add cleanup and the test:

```tsx
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows current maybe and rejected reasons directly in the guest table', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        invitations: [
          guest({ id: 'accepted', displayName: 'คุณมา', status: 'accepted', adultCount: 1, reason: 'ข้อความเก่า' }),
          guest({ id: 'maybe', displayName: 'คุณคิดดูก่อน', status: 'maybe', reason: 'รอเช็กตารางงาน' }),
          guest({ id: 'rejected', displayName: 'คุณไม่มา', status: 'rejected', reason: 'ติดเดินทาง' }),
          guest({ id: 'empty-maybe', displayName: 'คุณไม่ระบุ', status: 'maybe', reason: '   ' }),
        ],
        tables: [],
        checkInCode: null,
      }),
    }));
    render(<HostDashboard email="demo@local" demo />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'รายชื่อแขก' }));
    expect(screen.getByRole('columnheader', { name: 'เหตุผล' })).toBeInTheDocument();
    expect(within(screen.getByText('คุณคิดดูก่อน').closest('tr')!).getByText('รอเช็กตารางงาน')).toBeInTheDocument();
    expect(within(screen.getByText('คุณไม่มา').closest('tr')!).getByText('ติดเดินทาง')).toBeInTheDocument();
    expect(within(screen.getByText('คุณมา').closest('tr')!).getByText('—')).toBeInTheDocument();
    expect(within(screen.getByText('คุณไม่ระบุ').closest('tr')!).getByText('—')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Verify the dashboard test fails for the missing column**

Run `npm test -- src/components/host/host-dashboard.test.tsx`.

Expected: FAIL because the guest table has no `เหตุผล` column or reason cells.

- [ ] **Step 3: Add the helper and column**

Add above `Metric` in `src/components/host/host-dashboard.tsx`:

```ts
function reasonForGuest(invitation: Invitation) {
  if (invitation.status !== 'maybe' && invitation.status !== 'rejected') return '—';
  return invitation.reason?.trim() || '—';
}
```

Add `<th>เหตุผล</th>` after the status header and this cell after each status cell:

```tsx
<td className="guest-reason-cell">{reasonForGuest(guest)}</td>
```

Accepted and pending values stay hidden even if legacy data contains a reason.

- [ ] **Step 4: Wrap long reason text**

Add next to the existing guest-table rules in `src/app/globals.css`:

```css
.guest-reason-cell { min-width: 180px; max-width: 320px; line-height: 1.45; overflow-wrap: anywhere; white-space: normal; }
```

Keep `.guest-table-wrap { overflow-x: auto; }` unchanged.

- [ ] **Step 5: Verify the dashboard test passes**

Run `npm test -- src/components/host/host-dashboard.test.tsx`.

Expected: PASS with current reasons and fallback dashes rendered by status.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/components/host/host-dashboard.tsx src/components/host/host-dashboard.test.tsx src/app/globals.css
git commit -m "feat: show RSVP reasons in admin guest list"
```

### Task 4: Full Verification

**Files:**
- Verify only; modify a file only to fix a failure caused by Tasks 1-3.

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: fresh evidence that tests, lint, TypeScript compilation, and the Next.js production build succeed together.

- [ ] **Step 1: Run all tests**

Run `npm test`.

Expected: all Vitest files and tests PASS with 0 failures.

- [ ] **Step 2: Run lint**

Run `npm run lint`.

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Run the production build**

Run `npm run build`.

Expected: exit code 0; Next.js compiles TypeScript and completes the production build.

- [ ] **Step 4: Inspect the final diff and repository state**

```bash
git diff HEAD~3 --check
git diff HEAD~3 --stat
git status --short --branch
```

Expected: no whitespace errors, only planned changes, and a clean worktree.

- [ ] **Step 5: Review every requirement**

```text
[ ] successful self check-in returns unrevealed assigned tables
[ ] public invitation reveal behavior is unchanged
[ ] unassigned check-in keeps the staff fallback
[ ] maybe/rejected reasons are optional and capped at 500 characters
[ ] accepted has no reason field and clears stale current reason
[ ] Admin table shows reasons only for maybe/rejected and wraps long content
[ ] no dependency or database schema changes
```

Expected: every item is supported by a named test or explicit diff inspection; report any unmet item instead of claiming completion.
