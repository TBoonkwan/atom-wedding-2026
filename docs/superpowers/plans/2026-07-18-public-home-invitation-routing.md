# Public Home and Invitation Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Modern Xi experience the public home page, move personalized invitations to `/invitation/[token]`, and retire all demo/preview routes without touching production until local approval.

**Architecture:** Keep one `InvitationExperience` component with a discriminated `public` or `personalized` mode. The public route uses presentation-only data and removes every invitation-specific action; the personalized route continues loading Supabase data by secure token. Centralize invitation URL construction so host exports cannot regress to `/i/`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Supabase, Motion, Vercel.

## Global Constraints

- `/` is public and contains no RSVP, accepted-state calendar action, table data, or invite-code storage.
- `/invitation/[token]` is the only personalized guest route.
- `/invitation` redirects to `/`.
- `/i/*` and `/preview/*` return `404`; no compatibility redirect is allowed.
- Host and check-in routes remain unchanged.
- Do not mutate production Supabase, push Git, or deploy Vercel before user approval of the local result.

---

### Task 1: Add an explicit public invitation experience

**Files:**
- Create: `src/lib/domain/public-invitation.ts`
- Modify: `src/components/invitation/invitation-experience.tsx`
- Test: `src/components/invitation/invitation-experience.test.tsx`

**Interfaces:**
- Produces: `PUBLIC_WEDDING_PRESENTATION: PublicInvitation`
- Produces: `InvitationExperienceProps`, a discriminated union with `{ mode: 'public' }` and `{ mode?: 'personalized'; token; initialInvitation; calendarLinks; preview? }` variants.

- [ ] **Step 1: Write the failing public-mode test**

Add a test that renders `<InvitationExperience theme="modern-xi-club" mode="public" />`, opens the landing and envelope, and asserts:

```tsx
expect(screen.getByText('เรียนเชิญร่วมเป็นส่วนหนึ่งในวันของเรา')).toBeInTheDocument();
expect(screen.queryByRole('link', { name: 'ตอบรับ' })).not.toBeInTheDocument();
expect(screen.queryByRole('heading', { name: 'แล้วเจอกันไหม?' })).not.toBeInTheDocument();
expect(screen.queryByText('วันงานเช็กอินเองได้')).not.toBeInTheDocument();
expect(screen.queryByRole('link', { name: 'Google Calendar' })).not.toBeInTheDocument();
expect(window.localStorage.getItem('np-wedding-invite-code')).toBeNull();
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: TypeScript/test failure because `mode="public"` is not supported and required personalized props are missing.

- [ ] **Step 3: Add presentation-only data**

Create `PUBLIC_WEDDING_PRESENTATION` with neutral values and no real invitation code:

```ts
export const PUBLIC_WEDDING_PRESENTATION: PublicInvitation = {
  inviteCode: '',
  displayName: '',
  contactName: '',
  status: 'pending',
  adultCount: 0,
  childCount: 0,
  childSeatCount: 0,
  dietaryNotes: '',
  accessibilityNotes: '',
  reason: '',
  beerPreference: 'none',
  songRequest: '',
  lateResponse: false,
  checkedInCount: 0,
  tableNumbers: [],
};
```

- [ ] **Step 4: Implement the discriminated public mode**

Derive `isPersonalized` from the props. In public mode:

```tsx
const isPersonalized = props.mode !== 'public';
const initialInvitation = isPersonalized
  ? props.initialInvitation
  : PUBLIC_WEDDING_PRESENTATION;
```

Guard invite-code storage with `isPersonalized`, use `np-wedding-envelope-public` for the envelope UI state, render the neutral greeting, omit the RSVP quick-nav item, and wrap the RSVP/check-in sections in `isPersonalized ? (...) : null`. Access calendar URLs only inside the personalized accepted branch.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: all `InvitationExperience` tests pass.

- [ ] **Step 6: Commit the public mode**

```bash
git add src/lib/domain/public-invitation.ts src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx
git commit -m "feat: add public wedding experience mode"
```

### Task 2: Promote the experience to `/` and migrate invitation routes

**Files:**
- Create: `src/app/invitation/[token]/page.tsx`
- Create: `src/app/invitation/page.tsx`
- Create: `src/lib/domain/invitation-url.ts`
- Create: `src/lib/domain/invitation-url.test.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/host/host-dashboard.tsx`
- Delete: `src/app/i/[token]/page.tsx`

**Interfaces:**
- Consumes: `InvitationExperience` public and personalized modes from Task 1.
- Produces: `invitationPath(token: string): string`
- Produces: `invitationUrl(origin: string, token: string): string`

- [ ] **Step 1: Write failing canonical-link tests**

```ts
expect(invitationPath('abc 123')).toBe('/invitation/abc%20123');
expect(invitationUrl('https://example.com', 'secure-token'))
  .toBe('https://example.com/invitation/secure-token');
```

- [ ] **Step 2: Run the URL test and verify RED**

Run: `npm test -- src/lib/domain/invitation-url.test.ts`

Expected: FAIL because `src/lib/domain/invitation-url.ts` does not exist.

- [ ] **Step 3: Implement canonical invitation URL helpers**

```ts
export function invitationPath(token: string) {
  return `/invitation/${encodeURIComponent(token)}`;
}

export function invitationUrl(origin: string, token: string) {
  return new URL(invitationPath(token), origin).toString();
}
```

- [ ] **Step 4: Run the URL test and verify GREEN**

Run: `npm test -- src/lib/domain/invitation-url.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Replace the draft index with the public experience**

Make `src/app/page.tsx` render only:

```tsx
<InvitationExperience theme="modern-xi-club" mode="public" />
```

Move the existing token-loading page to `src/app/invitation/[token]/page.tsx` and pass `mode="personalized"`. Add `src/app/invitation/page.tsx` with `redirect('/')`. Delete `src/app/i/[token]/page.tsx` so `/i/*` is unrouteable.

- [ ] **Step 6: Update host link generation**

Replace the hard-coded `/i/${token}` in `HostDashboard` with:

```ts
return invitationUrl(window.location.origin, token);
```

- [ ] **Step 7: Run focused route-adjacent tests**

Run: `npm test -- src/lib/domain/invitation-url.test.ts src/components/invitation/invitation-experience.test.tsx src/lib/services/guest-import.test.ts`

Expected: all selected tests pass.

- [ ] **Step 8: Commit the route migration**

```bash
git add src/app/page.tsx src/app/invitation src/app/i src/lib/domain/invitation-url.ts src/lib/domain/invitation-url.test.ts src/components/host/host-dashboard.tsx
git commit -m "feat: promote wedding experience to public home"
```

### Task 3: Retire previews and production-facing demo documentation

**Files:**
- Delete: `src/app/preview/[theme]/page.tsx`
- Modify: `src/proxy.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: production routes created in Task 2.
- Produces: no `/preview/*` or `/i/*` entries in the Next.js route manifest.

- [ ] **Step 1: Remove the preview route and middleware match**

Delete `src/app/preview/[theme]/page.tsx`. Remove preview Basic Auth handling and `/preview/:path*` from the proxy matcher while retaining `/host/:path*` and `/api/host/:path*` session refresh.

- [ ] **Step 2: Replace README route documentation**

Document these routes exactly:

```md
- `/` — public wedding experience without RSVP
- `/invitation/[token]` — personalized guest invitation and RSVP
- `/host` — host dashboard
- `/check-in` — venue self check-in
```

Remove instructions that mention visual drafts, `/preview/*`, `/i/demo`, or selecting a theme.

- [ ] **Step 3: Build and inspect the route table**

Run: `npm run build`

Expected: exit code 0; route output includes `/`, `/invitation`, and `/invitation/[token]`, and does not include `/i/[token]` or `/preview/[theme]`.

- [ ] **Step 4: Commit retired routes**

```bash
git add src/app/preview src/proxy.ts README.md
git commit -m "chore: retire wedding demo routes"
```

### Task 4: Full local verification and user handoff

**Files:**
- Modify only files required by failures found in the checks below.

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: a local URL for user approval; no external deployment.

- [ ] **Step 1: Run all automated checks**

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: all tests pass, lint exits 0, production build exits 0, and `git diff --check` prints no errors.

- [ ] **Step 2: Start the local application without production Supabase credentials**

Run:

```bash
NEXT_PUBLIC_SUPABASE_URL='' \
NEXT_PUBLIC_SUPABASE_ANON_KEY='' \
SUPABASE_SERVICE_ROLE_KEY='' \
NEXT_PUBLIC_SITE_URL='http://localhost:3000' \
npm run dev
```

Expected: Next.js reports `http://localhost:3000` and `getRepository()` selects the in-memory local demo repository. This prevents local RSVP testing from reading or mutating production Supabase.

- [ ] **Step 3: Verify routes in a mobile-sized browser**

At `/`, verify the black-and-white landing, envelope, details, palette, gallery, and absence of RSVP/calendar/check-in invitation data. At `/invitation/demo-np-2026`, verify the personalized local fixture still supports RSVP only when the local demo repository is active. Verify `/i/demo-np-2026` and `/preview/modern-xi-club` return not found, and `/invitation` redirects to `/`.

- [ ] **Step 4: Inspect repository state**

Run:

```bash
git status --short --branch
git log -5 --oneline
```

Expected: local `main` contains the implementation commits, has no uncommitted implementation changes, and is ahead of `origin/main`; no push has occurred.

- [ ] **Step 5: Request user approval**

Provide the local URL and concise test evidence. Do not delete the production demo invitation, push `main`, or trigger Vercel until the user explicitly approves the local result.
