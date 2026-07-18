# Host Guest Creation and Drag-and-Drop Table Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a host create one invitation in the dashboard and drag an accepted, entirely unseated invitation onto a table to assign the whole responding party.

**Architecture:** Keep `HostDashboard` as the shared data owner, add focused `GuestCreateModal` and `TablePlanner` client components, and extend the existing guest POST route with a backward-compatible single-guest body. Pure table-domain helpers determine party size and pool membership; `@dnd-kit/core` supplies pointer, touch, keyboard, and live-region behavior while the existing table API remains authoritative.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Zod 4, Vitest 4, React Testing Library, `@dnd-kit/core` 6.3.1, existing Supabase/demo repositories.

## Global Constraints

- Read relevant files in `node_modules/next/dist/docs/` before writing application code because this repository's Next.js version contains breaking changes.
- Manual creation accepts one invitation only and preserves the existing CSV import request/response.
- The drag pool contains only `accepted` invitations with zero table assignments.
- A drop assigns `adultCount + childCount` seats; split-table assignment remains in the existing numeric/select controls.
- Server validation is authoritative; failed drops do not remove a guest from the pool.
- Do not change the database schema or raw-token storage rules.

---

### Task 1: Add table-planning domain selectors

**Files:**
- Modify: `src/lib/domain/tables.ts`
- Test: `src/lib/domain/tables.test.ts`

**Interfaces:**
- Produces: `invitationPartySize(invitation: Invitation): number`
- Produces: `listUnassignedAcceptedInvitations(invitations: Invitation[], assignments: TableAssignment[]): Invitation[]`

- [ ] **Step 1: Write the failing domain tests**

Extend the import and add these cases to `src/lib/domain/tables.test.ts`:

```ts
import {
  invitationPartySize,
  listUnassignedAcceptedInvitations,
  summarizeInvitationSeats,
  summarizeTables,
  validateSeatAssignment,
} from './tables';

it('calculates the full responding party size', () => {
  expect(invitationPartySize(acceptedInvitation)).toBe(4);
});

it('lists only accepted invitations with no table assignment', () => {
  const pendingInvitation = { ...acceptedInvitation, id: 'i2', status: 'pending' as const };
  const seatedInvitation = { ...acceptedInvitation, id: 'i3' };

  expect(listUnassignedAcceptedInvitations(
    [acceptedInvitation, pendingInvitation, seatedInvitation],
    [{ invitationId: 'i3', tableId: 't1', seatCount: 4 }],
  ).map((item) => item.id)).toEqual(['i1']);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/lib/domain/tables.test.ts`

Expected: FAIL because both new exports are missing.

- [ ] **Step 3: Implement the selectors and reuse the party-size helper**

Add to `src/lib/domain/tables.ts` and replace repeated `adultCount + childCount` expressions in the same file:

```ts
export function invitationPartySize(invitation: Invitation) {
  return invitation.adultCount + invitation.childCount;
}

export function listUnassignedAcceptedInvitations(
  invitations: Invitation[],
  assignments: TableAssignment[],
) {
  const assignedInvitationIds = new Set(assignments.map((item) => item.invitationId));
  return invitations.filter((invitation) =>
    invitation.status === 'accepted' && !assignedInvitationIds.has(invitation.id));
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- src/lib/domain/tables.test.ts`

Expected: all table-domain tests pass.

- [ ] **Step 5: Commit the domain behavior**

```bash
git add src/lib/domain/tables.ts src/lib/domain/tables.test.ts
git commit -m "feat: identify unassigned accepted guests"
```

### Task 2: Support creating one guest through the host API

**Files:**
- Create: `src/app/api/host/guests/route.test.ts`
- Modify: `src/app/api/host/guests/route.ts`

**Interfaces:**
- Consumes: `prepareGuestInvitations(rows, createRandomBytes?, reservedInviteCodes?)`
- Produces: `POST /api/host/guests` body `{ guest: { displayName, contactName, phone?, email?, hostNotes? } }`
- Produces: response `{ imported: 1, links: ImportedLink[] }` and audit action `guest_create`

- [ ] **Step 1: Write failing route tests for single creation and duplicate rejection**

Create `src/app/api/host/guests/route.test.ts` with hoisted mocks for `getHostSession` and `getRepository`. The successful test submits a `{ guest }` body, asserts one record is passed to `createInvitations`, checks that the returned raw token is absent from that stored record, and expects `recordAudit('host-1', 'guest_create', 'invitation', createdId, { count: 1 })`. The duplicate test supplies an existing invitation with the same case-insensitive email and expects status 422, no insert, and a Thai duplicate error. Add a CSV regression test asserting `{ csv }` still records `guest_import`.

Use this shared mock shape:

```ts
const mocks = vi.hoisted(() => ({
  getHostSession: vi.fn(),
  listInvitations: vi.fn(),
  createInvitations: vi.fn(),
  recordAudit: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ getHostSession: mocks.getHostSession }));
vi.mock('@/lib/data/get-repository', () => ({
  getRepository: () => ({
    listInvitations: mocks.listInvitations,
    createInvitations: mocks.createInvitations,
    recordAudit: mocks.recordAudit,
  }),
}));
```

- [ ] **Step 2: Run the route tests and verify RED**

Run: `npm test -- src/app/api/host/guests/route.test.ts`

Expected: the single-guest request fails validation because the route only accepts `{ csv }`.

- [ ] **Step 3: Add the backward-compatible request union and shared duplicate validation**

In `src/app/api/host/guests/route.ts`, define:

```ts
const guestSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40).optional().default(''),
  email: z.union([z.email(), z.literal('')]).optional().default(''),
  hostNotes: z.string().trim().max(500).optional().default(''),
});

const createSchema = z.union([
  z.object({ csv: z.string().min(1).max(1_000_000) }),
  z.object({ guest: guestSchema }),
]);

function duplicateErrors(
  rows: z.infer<typeof guestSchema>[],
  existing: Invitation[],
) {
  return rows.flatMap((row, index) => {
    const duplicate = existing.some((invitation) =>
      (row.email && invitation.email?.toLowerCase() === row.email.toLowerCase()) ||
      (row.phone && invitation.phone?.replace(/\D/g, '') === row.phone.replace(/\D/g, '')),
    );
    return duplicate ? [`${rows.length > 1 ? `แถว ${index + 2}: ` : ''}email หรือโทรศัพท์มีอยู่ในระบบแล้ว`] : [];
  });
}
```

Parse the union, derive `rows` from `parseGuestCsv(input.csv)` or `[input.guest]`, preserve CSV parse errors, prepare and insert the rows once, then audit with `guest_import` for CSV or `guest_create` for a guest. Include the created invitation ID in the single audit and return the existing link response shape.

- [ ] **Step 4: Run focused API and service tests and verify GREEN**

Run: `npm test -- src/app/api/host/guests/route.test.ts src/lib/services/guest-import.test.ts src/lib/domain/csv.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit single-guest API support**

```bash
git add src/app/api/host/guests/route.ts src/app/api/host/guests/route.test.ts
git commit -m "feat: create individual host invitations"
```

### Task 3: Build and test the manual guest modal

**Files:**
- Create: `src/components/host/guest-create-modal.tsx`
- Create: `src/components/host/guest-create-modal.test.tsx`

**Interfaces:**
- Produces: `ImportedLink { displayName: string; inviteCode: string; token: string }`
- Produces: `GuestCreateModal({ onClose, onCreated })`
- `onCreated(links: ImportedLink[]): Promise<void> | void`

- [ ] **Step 1: Write failing component tests**

Test that the modal renders all five labelled fields, browser validation blocks empty required fields, a valid submit sends this exact body, and a failed response retains entered values while showing the server error:

```ts
expect(fetch).toHaveBeenCalledWith('/api/host/guests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    guest: {
      displayName: 'ครอบครัวสุขใจ',
      contactName: 'คุณเอ',
      phone: '0812345678',
      email: 'a@example.com',
      hostNotes: 'เพื่อนเจ้าบ่าว',
    },
  }),
});
```

For success, mock `{ links: [{ displayName: 'ครอบครัวสุขใจ', inviteCode: 'ABC123', token: 'raw-token' }] }`, expect `onCreated` with the link, and expect `onClose` after the callback completes.

- [ ] **Step 2: Run the modal test and verify RED**

Run: `npm test -- src/components/host/guest-create-modal.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the modal**

Create a client component with controlled string fields, a `submitting` boolean, and a local `error`. Submit with `fetch`, parse `errors?.join(' · ') ?? error`, retain values on failure, call `onCreated(data.links)`, and close only on success. Use the existing `host-modal-backdrop`, `host-modal`, `modal-close`, `host-primary-button`, and `form-error` classes. Disable both close and submit while the request is pending and label the close control `ปิดหน้าต่างเพิ่มแขก`.

The exported types and prop shape are:

```ts
export interface ImportedLink {
  displayName: string;
  inviteCode: string;
  token: string;
}

interface GuestCreateModalProps {
  onClose: () => void;
  onCreated: (links: ImportedLink[]) => Promise<void> | void;
}
```

- [ ] **Step 4: Run the component test and verify GREEN**

Run: `npm test -- src/components/host/guest-create-modal.test.tsx`

Expected: all modal tests pass with no React warnings.

- [ ] **Step 5: Commit the modal**

```bash
git add src/components/host/guest-create-modal.tsx src/components/host/guest-create-modal.test.tsx
git commit -m "feat: add manual guest creation modal"
```

### Task 4: Build the drag-and-drop table planner

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/host/table-planner.tsx`
- Create: `src/components/host/table-planner.test.tsx`

**Interfaces:**
- Consumes: `listUnassignedAcceptedInvitations` and `invitationPartySize`
- Produces: `TableSummary` export used by `HostDashboard`
- Produces: `TablePlanner({ invitations, tables, onAssign, onRemove, onToggleReveal })`
- `onAssign(tableId: string, invitationId: string, seatCount: number): Promise<boolean>`

- [ ] **Step 1: Install the reviewed drag-and-drop dependency**

Run: `npm install @dnd-kit/core@^6.3.1`

Expected: `package.json` and `package-lock.json` add `@dnd-kit/core` without peer-dependency errors.

- [ ] **Step 2: Write failing planner tests**

Mock `@dnd-kit/core` so `DndContext` captures `onDragEnd`, `useDraggable` and `useDroppable` return inert refs/props, and sensors return inert values. Render one accepted unassigned invitation, one pending invitation, and one seated invitation. Assert only the accepted unassigned name appears in `แขกที่ยังไม่มีโต๊ะ`.

Invoke the captured handler with:

```ts
await act(async () => {
  await onDragEnd?.({
    active: { id: 'i1' },
    over: { id: 'table:t1' },
  });
});
expect(onAssign).toHaveBeenCalledWith('t1', 'i1', 4);
```

Also invoke it with `over: null` and assert no additional assignment request. Rerender with an assignment for `i1` and assert the card leaves the pool.

- [ ] **Step 3: Run the planner tests and verify RED**

Run: `npm test -- src/components/host/table-planner.test.tsx`

Expected: FAIL because `TablePlanner` does not exist.

- [ ] **Step 4: Implement the planner with accessible sensors and existing fallback controls**

Create a client component using `DndContext`, `DragOverlay`, `PointerSensor`, `TouchSensor`, `KeyboardSensor`, `useSensor`, `useSensors`, `useDraggable`, and `useDroppable`. Use pointer distance `6` and touch delay `150` with tolerance `5`. Prefix droppable IDs with `table:` and ignore drops without that prefix.

The drag completion logic must be equivalent to:

```ts
async function handleDragEnd(event: DragEndEvent) {
  setActiveInvitationId(null);
  const invitation = unassigned.find((item) => item.id === String(event.active.id));
  const target = event.over ? String(event.over.id) : '';
  if (!invitation || !target.startsWith('table:')) return;
  setAssigningInvitationId(invitation.id);
  await onAssign(target.slice('table:'.length), invitation.id, invitationPartySize(invitation));
  setAssigningInvitationId(null);
}
```

Render semantic button-based guest cards, a Thai `screenReaderInstructions.draggable`, a Thai drag overlay, droppable table articles, visible `isOver` styling, the existing assignment list/remove button, numeric seat input, accepted-invitation select fallback, and reveal toggle. Render `จัดโต๊ะให้แขกที่ตอบรับครบแล้ว` when the pool is empty.

- [ ] **Step 5: Run planner and domain tests and verify GREEN**

Run: `npm test -- src/components/host/table-planner.test.tsx src/lib/domain/tables.test.ts`

Expected: all tests pass.

- [ ] **Step 6: Commit the planner**

```bash
git add package.json package-lock.json src/components/host/table-planner.tsx src/components/host/table-planner.test.tsx
git commit -m "feat: drag unassigned guests onto tables"
```

### Task 5: Integrate both workflows into the host dashboard

**Files:**
- Create: `src/components/host/host-dashboard.test.tsx`
- Modify: `src/components/host/host-dashboard.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `GuestCreateModal`, `ImportedLink`, and `TablePlanner`
- Preserves: current dashboard polling, realtime loading, CSV import, link export, table split controls, and notices

- [ ] **Step 1: Write a failing dashboard integration test**

Create `src/components/host/host-dashboard.test.tsx` and mock the focused child components:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./guest-create-modal', () => ({
  GuestCreateModal: () => <div>guest-create-modal</div>,
}));
vi.mock('./table-planner', () => ({
  TablePlanner: () => <div>table-planner</div>,
}));

import { HostDashboard } from './host-dashboard';

describe('HostDashboard guest and table workflows', () => {
  it('opens manual guest creation and renders the drag table planner', () => {
    render(<HostDashboard email="demo@local" demo />);

    fireEvent.click(screen.getByRole('button', { name: 'รายชื่อแขก' }));
    fireEvent.click(screen.getByRole('button', { name: /เพิ่มแขก/ }));
    expect(screen.getByText('guest-create-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'จัดโต๊ะ' }));
    expect(screen.getByText('table-planner')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the dashboard test and verify RED**

Run: `npm test -- src/components/host/host-dashboard.test.tsx`

Expected: FAIL because the dashboard has no `เพิ่มแขก` button and does not render `TablePlanner`.

- [ ] **Step 3: Wire the modal and planner into `HostDashboard`**

Import `Plus`, `GuestCreateModal`, its `ImportedLink` type, and `TablePlanner`. Remove the local `ImportedLink` and `TableSummary` declarations only after importing the new exports. Add `const [creatingGuest, setCreatingGuest] = useState(false)`.

Add this toolbar control before CSV import:

```tsx
<button type="button" className="host-outline-button" onClick={() => setCreatingGuest(true)}>
  <Plus size={17} /> เพิ่มแขก
</button>
```

Handle successful creation with:

```ts
async function guestCreated(links: ImportedLink[]) {
  setImportedLinks((current) => [...current, ...links]);
  setNotice('เพิ่มแขกและสร้างลิงก์เชิญแล้ว — กรุณาเก็บลิงก์ก่อนปิดหน้านี้');
  await load();
}
```

Render `GuestCreateModal` when `creatingGuest` is true. Replace the inline table planner JSX with:

```tsx
<TablePlanner
  invitations={invitations}
  tables={tables}
  onAssign={assignTable}
  onRemove={removeAssignment}
  onToggleReveal={toggleReveal}
/>
```

Update `assignTable` to catch network errors, return `false` on failure, set the Thai notice, reload and return `true` on success. Keep the existing table API payload unchanged.

- [ ] **Step 4: Add responsive, focus, drag, drop-target, busy, and empty-pool styles**

In `src/app/globals.css`, add focused styles for:

```css
.guest-toolbar-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.unassigned-guest-pool { margin-bottom: 18px; padding: 18px; border: 1px dashed #8f6b5845; border-radius: 14px; background: #fffaf7; }
.unassigned-guest-list { display: flex; flex-wrap: wrap; gap: 10px; }
.unassigned-guest-card { min-width: 180px; padding: 12px 14px; border: 1px solid #7654422e; border-radius: 10px; background: white; color: inherit; cursor: grab; text-align: left; touch-action: none; }
.unassigned-guest-card:focus-visible { outline: 2px solid #a76c5e; outline-offset: 3px; }
.unassigned-guest-card.dragging, .unassigned-guest-card:disabled { opacity: .55; cursor: grabbing; }
.table-drop-target { border-radius: 14px; transition: box-shadow .16s ease, transform .16s ease; }
.table-drop-target.is-over { box-shadow: 0 0 0 3px #a76c5e70; transform: translateY(-2px); }
.table-drag-overlay { box-shadow: 0 12px 30px #3a21152e; }
```

At the mobile breakpoint, make `.guest-toolbar-actions` full-width and keep guest cards at a comfortable touch size.

- [ ] **Step 5: Run focused tests, lint, and type-aware build checks**

Run:

```bash
npm test -- src/components/host/guest-create-modal.test.tsx src/components/host/table-planner.test.tsx src/app/api/host/guests/route.test.ts src/lib/domain/tables.test.ts
npm run lint
```

Expected: tests and lint pass with no warnings or errors.

- [ ] **Step 6: Commit dashboard integration**

```bash
git add src/components/host/host-dashboard.tsx src/components/host/host-dashboard.test.tsx src/app/globals.css
git commit -m "feat: integrate host guest and seating workflows"
```

### Task 6: Verify the complete application

**Files:**
- Verify only; modify implementation or tests only when a check exposes a real defect.

**Interfaces:**
- Verifies all interfaces from Tasks 1–5 together.

- [ ] **Step 1: Run the complete automated test suite**

Run: `npm test`

Expected: all Vitest suites pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Run a production build**

Run: `npm run build`

Expected: Next.js 16.2.10 compiles, type-checks, and emits all routes successfully.

- [ ] **Step 4: Inspect the final diff and worktree**

Run:

```bash
git diff --check
git status --short
git log --oneline -8
```

Expected: no whitespace errors; only intentional uncommitted verification fixes, if any, remain.

- [ ] **Step 5: Commit any verification-only fixes**

If Step 1–4 required a correction, stage only those corrected files and commit them with a message describing the defect. Otherwise, do not create an empty commit.
