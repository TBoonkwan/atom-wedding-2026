# Modern 囍 Club Theme and Gallery Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Modern 囍 Club the production invitation theme, feature the single black-and-white ring portrait in “ก่อนเราจะเจอกัน” without cropping it, and make the invitation feel shorter and more playful to navigate.

**Architecture:** Keep the existing `InvitationExperience` theme contract unchanged. Change only the production route’s selected `DraftTheme`, add a theme-scoped shortcut rail and reveal-on-scroll behavior, and scope compact layout/image-fit overrides to Modern so other drafts and dashboard styles are unaffected.

**Tech Stack:** Next.js App Router, React, TypeScript, global CSS, Vitest, ESLint.

## Global Constraints

- Preserve all existing invitation, RSVP, calendar, check-in, and Supabase behavior.
- Keep the Modern 囍 Club palette, typography, compact layout, and motion scoped by `data-theme="modern-xi-club"`.
- Do not expose or modify invitation token handling.
- Verify with the focused tests, full test suite, lint, and production build.

---

### Task 1: Apply production theme, compact navigation, and single-image gallery treatment

**Files:**
- Modify: `src/app/i/[token]/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/invitation/invitation-experience.tsx`
- Test: `src/components/invitation/invitation-experience.test.tsx`

**Interfaces:**
- Consumes: `InvitationExperience`’s existing `theme: DraftTheme` prop and gallery section styles.
- Produces: production invitations rendered with `theme="modern-xi-club"`; compact section shortcuts; reveal-on-scroll with anchor fallback; and one uncropped feature image using `/gallery/photo-08.jpg`.

- [ ] **Step 1: Change the production route theme**

Replace the route prop value:

```tsx
theme="modern-xi-club"
```

- [ ] **Step 2: Add compact shortcuts and safe reveal behavior**

Render a Modern-only navigation rail linking to `#schedule`, `#venue`, `#gallery`, and `#rsvp`. Mark content sections with `data-reveal`; the client component observes them, immediately reveals sections already in the viewport, listens for scroll, and uses `:target` CSS so smooth anchor jumps never land on hidden content.

- [ ] **Step 3: Show the black-and-white ring portrait as the only gallery image**

Render `/gallery/photo-08.jpg` once at its native 3:2 aspect ratio and style it as a full-width feature image:

```css
.gallery-feature img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 2;
  object-fit: contain;
}
```

Remove the horizontal multi-image layout and retain the Modern rounded frame treatment.

- [ ] **Step 4: Tighten Modern layout and motion**

Scope reduced spacing, horizontal timeline cards, rounded surfaces, a compact calendar card, hero breathing animation, and reduced-motion overrides to `[data-theme="modern-xi-club"]`.

- [ ] **Step 5: Run verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all tests pass, ESLint exits 0, and Next.js completes the production build.
