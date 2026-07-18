# Centered Invitation Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the Modern invitation timeline's number, connector, marker, time, and title on one horizontal axis at mobile and desktop widths.

**Architecture:** Preserve the existing chronological markup and add one Modern-only centered-layout class as a stable markup/CSS contract. CSS changes the Modern stepper items from three-column rows to centered vertical stacks and draws connector segments from each marker center to the next, while opaque text masks prevent the line from crossing glyphs. Legacy themes remain on their current base timeline styles.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Vitest 4, Testing Library, global CSS.

## Global Constraints

- Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`, and `node_modules/next/dist/docs/03-architecture/accessibility.md` before editing.
- Do not add dependencies, routes, event data, or new interactive state.
- Keep `TIMELINE` order, copy, icons, and semantic `article`/`time` markup unchanged.
- Apply centered treatment only to the Modern theme.
- Keep both legacy themes unchanged.
- Keep chronological DOM order identical to visual order.
- Preserve reveal and reduced-motion behavior.
- Introduce no horizontal page or timeline overflow.

## File Map

- Modify `src/components/invitation/invitation-experience.tsx`: add the Modern-only `.timeline-stepper-centered` markup hook.
- Modify `src/components/invitation/invitation-experience.test.tsx`: assert the centered hook for Modern and its absence for legacy themes.
- Modify `src/app/globals.css`: replace Modern row geometry with a constrained centered stack and marker-to-marker connector segments.

---

### Task 1: Center the Modern vertical stepper

**Files:**
- Modify: `src/components/invitation/invitation-experience.tsx`
- Test: `src/components/invitation/invitation-experience.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing `isModernTheme`, `TIMELINE`, `.timeline-list`, `.timeline-stepper`, `.timeline-item`, `.timeline-index`, and `.timeline-symbol` contracts.
- Produces: Modern-only `.timeline-stepper-centered`; no new React state or component API.

- [ ] **Step 1: Add the failing centered-layout contract test**

In `renders the Modern timeline as a chronological vertical stepper` in `src/components/invitation/invitation-experience.test.tsx`, strengthen the class assertion:

```tsx
expect(timeline).toHaveClass('timeline-stepper', 'timeline-stepper-centered');
```

In `keeps the %s timeline out of the Modern stepper treatment`, add:

```tsx
expect(timeline).not.toHaveClass('timeline-stepper-centered');
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/components/invitation/invitation-experience.test.tsx -t "timeline"
```

Expected: FAIL because the Modern timeline has `.timeline-stepper` but not `.timeline-stepper-centered`.

- [ ] **Step 3: Add the minimal Modern-only markup hook**

In `src/components/invitation/invitation-experience.tsx`, replace the timeline list opening tag with:

```tsx
<div className={`timeline-list${isModernTheme ? ' timeline-stepper timeline-stepper-centered' : ''}`}>
```

- [ ] **Step 4: Run the focused test and verify GREEN for the markup contract**

Run:

```bash
npm test -- src/components/invitation/invitation-experience.test.tsx -t "timeline"
```

Expected: PASS for all focused Modern and legacy timeline cases.

- [ ] **Step 5: Replace the Modern stepper geometry with a centered stack**

In `src/app/globals.css`, replace the existing Modern `.timeline-stepper` block through its Modern heading-size rule with:

```css
[data-theme="modern-xi-club"] .timeline-stepper-centered {
  --stepper-marker-y: 59px;
  width: min(420px, 100%);
  margin-inline: auto;
  padding: 0;
  border: 0;
  overflow: visible;
}
[data-theme="modern-xi-club"] .timeline-stepper-centered::before { content: none; }
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 0;
  gap: 6px;
  padding: 12px 16px 36px;
  border: 0;
  background: transparent;
  box-shadow: none;
  text-align: center;
}
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-item:not(:last-child)::before {
  content: "";
  position: absolute;
  z-index: 0;
  top: var(--stepper-marker-y);
  bottom: calc(0px - var(--stepper-marker-y));
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: linear-gradient(var(--accent), color-mix(in srgb, var(--accent) 30%, transparent));
}
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-index,
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-item > div {
  position: relative;
  z-index: 1;
  padding-inline: 10px;
  background: var(--paper);
}
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-symbol {
  position: relative;
  z-index: 1;
  width: 54px;
  height: 54px;
  border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent);
  background: var(--surface);
  box-shadow: 0 8px 24px #160a0828;
}
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-item time,
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-item h3 {
  text-align: center;
}
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-item h3 { font-size: 20px; }
```

Inside `@media (max-width: 540px)`, replace the current Modern timeline overrides with:

```css
[data-theme="modern-xi-club"] .timeline-stepper-centered { --stepper-marker-y: 54px; }
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-item {
  gap: 6px;
  padding: 12px 12px 30px;
}
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-symbol {
  width: 44px;
  height: 44px;
}
[data-theme="modern-xi-club"] .timeline-stepper-centered .timeline-item h3 { font-size: 18px; }
```

- [ ] **Step 6: Run focused tests and targeted lint**

Run:

```bash
npm test -- src/components/invitation/invitation-experience.test.tsx
npx eslint src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx
```

Expected: all focused tests PASS and ESLint exits 0.

- [ ] **Step 7: Commit the centered stepper**

```bash
git add src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx src/app/globals.css
git commit -m "feat: center invitation timeline steps"
```

---

### Task 2: Full and responsive verification

**Files:**
- Verify only; modify Task 1 files only if verification reveals a scoped defect.

**Interfaces:**
- Consumes: completed centered-stepper markup and CSS.
- Produces: verified responsive centered timeline.

- [ ] **Step 1: Run complete automated verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all Vitest tests pass; ESLint and Next.js build exit 0.

- [ ] **Step 2: Verify responsive layout in the supported Browser/IAB**

Use the local development server from this exact worktree and inspect `/` at 390×844 and 1440×900. At both widths verify:

- The timeline list is horizontally centered in its section.
- Every event number, marker, time, and title shares the timeline center x-coordinate.
- Connector segments begin/end at marker centers and do not cross visible text.
- Chronological order remains 15:00, 15:40, 17:00, 18:00–20:00, 20:00–22:00.
- Body and timeline have no horizontal overflow.
- Legacy-theme tests remain green.

Expected: all checks pass with no console error.

- [ ] **Step 3: Record clean repository evidence**

Run:

```bash
git status --short
git log -3 --oneline
```

Expected: no uncommitted source changes; the centered-stepper commit is at HEAD.
