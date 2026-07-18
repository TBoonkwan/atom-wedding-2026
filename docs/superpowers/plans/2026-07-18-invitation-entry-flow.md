# Wedding Invitation Entry Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cinematic ring-portrait landing before the invitation envelope, preserve returning-guest behavior, add the supplied wedding colors and a four-image lightbox gallery, compact the detail header, and remove the RSVP song-request control.

**Architecture:** Keep `/i/[token]` as the only guest URL. `InvitationExperience` adds an in-memory landing state before the existing invitation-scoped `EnvelopeGate`; focused `InvitationLanding` and `WeddingGallery` components own their visual interactions, while the existing service and database contracts remain unchanged.

**Tech Stack:** Next.js App Router, React 19, TypeScript, `next/image`, Motion, Lucide, Vitest, Testing Library, global CSS.

## Global Constraints

- Apply the new entry flow to the selected `modern-xi-club` theme; leave the other visual draft entry flows unchanged.
- Show `/gallery/photo-08.jpg` completely with `object-fit: contain`; a separate blurred backdrop may crop, but the foreground portrait may not.
- Every visit starts at Landing. After Enter, an invitation with stored envelope state skips directly to Details.
- Wedding Colors are labels and swatches only: Chocolate Brown `#553725`, Mocha `#987863`, Dusty Pink `#d1afa6`, Blush Pink `#d5acab`.
- Detail gallery contains exactly `photo-02.jpg`, `photo-03.jpg`, `photo-04.jpg`, and `photo-07.jpg`.
- Remove only the guest-visible After Party song-request control; keep ambient music and legacy domain/database compatibility.
- Preserve RSVP editing, Reject payment QR, Accept-only Calendar, token isolation, dashboard, tables, and check-in behavior.
- Do not add analytics, cookies, a second detail URL, or third-party requests containing invitation tokens.
- Do not commit, push, or stage unless the user explicitly requests it.

---

## File Structure

- Create `src/components/invitation/invitation-landing.tsx`: full-viewport landing image and Enter action.
- Create `src/components/invitation/invitation-landing.test.tsx`: landing semantics and image treatment tests.
- Create `src/components/invitation/wedding-gallery.tsx`: four-image horizontal reel and accessible lightbox.
- Create `src/components/invitation/wedding-gallery.test.tsx`: gallery count and lightbox interaction tests.
- Modify `src/components/invitation/invitation-experience.tsx`: compose Landing → Envelope → Details, add Wedding Colors, use the focused gallery, and compact the details structure.
- Modify `src/components/invitation/invitation-experience.test.tsx`: cover first/returning entry flow and Wedding Colors.
- Modify `src/components/invitation/envelope.tsx`: make local-storage reads/writes non-blocking and expose reliable focus targets.
- Modify `src/components/invitation/envelope.test.tsx`: cover unavailable local storage.
- Modify `src/components/invitation/rsvp-form.tsx`: remove the visible song request while preserving payload shape.
- Modify `src/components/invitation/rsvp-form.test.tsx`: assert the field is absent and submission remains compatible.
- Modify `src/app/globals.css`: landing, compact detail hero, colors, gallery reel/lightbox, responsive, and reduced-motion styles.

---

### Task 1: Cinematic Invitation Landing

**Files:**
- Create: `src/components/invitation/invitation-landing.tsx`
- Create: `src/components/invitation/invitation-landing.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `{ onEnter: () => void }` from `InvitationExperience`.
- Produces: `InvitationLanding({ onEnter }: { onEnter: () => void })` with a button named `Enter to our wedding`.

- [ ] **Step 1: Write the failing landing tests**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InvitationLanding } from './invitation-landing';

describe('InvitationLanding', () => {
  it('shows the complete ring portrait as the invitation entry', () => {
    render(<InvitationLanding onEnter={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์ถือแหวนแต่งงาน' }))
      .toHaveClass('invitation-landing-portrait');
    expect(screen.getByRole('button', { name: 'Enter to our wedding' })).toBeInTheDocument();
  });

  it('enters when the guest activates the button', () => {
    const onEnter = vi.fn();
    render(<InvitationLanding onEnter={onEnter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    expect(onEnter).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run src/components/invitation/invitation-landing.test.tsx`
Expected: FAIL because `./invitation-landing` does not exist.

- [ ] **Step 3: Implement the focused landing component**

Use two image layers: an `aria-hidden` blurred `fill` image and one visible 1800×1200 foreground image.

```tsx
'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

export function InvitationLanding({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.main className="invitation-landing" exit={{ opacity: 0 }}>
      <Image aria-hidden className="invitation-landing-backdrop" src="/gallery/photo-08.jpg" alt="" fill priority sizes="100vw" />
      <Image className="invitation-landing-portrait" src="/gallery/photo-08.jpg" alt="ณัฐพลและเพ็ญพิสุทธิ์ถือแหวนแต่งงาน" width={1800} height={1200} priority sizes="100vw" />
      <div className="invitation-landing-shade" aria-hidden="true" />
      <div className="invitation-landing-copy">
        <p>NATHAPOL & PENNISUT</p>
        <h1>04 · 12 · 2026</h1>
        <button type="button" onClick={onEnter}>Enter to our wedding</button>
      </div>
    </motion.main>
  );
}
```

- [ ] **Step 4: Add landing CSS**

Add fixed visual layering, `object-fit: contain` on `.invitation-landing-portrait`, blurred `object-fit: cover` only on the backdrop, contrast overlay, slow zoom, keyboard focus ring, and a `prefers-reduced-motion` override that removes the zoom.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- --run src/components/invitation/invitation-landing.test.tsx`
Expected: 2 tests PASS.

---

### Task 2: Landing → Envelope → Returning Details Flow

**Files:**
- Modify: `src/components/invitation/invitation-experience.tsx`
- Modify: `src/components/invitation/invitation-experience.test.tsx`
- Modify: `src/components/invitation/envelope.tsx`
- Modify: `src/components/invitation/envelope.test.tsx`

**Interfaces:**
- Consumes: `InvitationLanding` from Task 1 and `EnvelopeGate`'s existing `storageKey`, `defaultOpen`, and `onOpen` props.
- Produces: Modern-only in-memory entry state; safe envelope storage helpers; focus targets `invitation-envelope-button` and `invitation-detail-heading`.

- [ ] **Step 1: Write failing integration tests**

Add tests that render Modern, assert Landing is initially visible, click Enter and assert the envelope appears without stored state, then store `np-wedding-envelope-modern-xi-club=opened`, re-render, click Enter, and assert the personalized detail heading appears without the envelope.

```tsx
expect(screen.getByRole('button', { name: 'Enter to our wedding' })).toBeInTheDocument();
fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
expect(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' })).toBeInTheDocument();

window.localStorage.setItem('np-wedding-envelope-modern-xi-club', 'opened');
// render a fresh component
fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
expect(screen.queryByRole('button', { name: 'เปิดซองคำเชิญ' })).not.toBeInTheDocument();
expect(screen.getByRole('heading', { name: /Nathapol/i })).toBeInTheDocument();
```

Add an envelope unit test that replaces `window.localStorage.getItem` and `setItem` with throwing functions, clicks Open, and still expects the children to render.

- [ ] **Step 2: Run the two focused test files and verify RED**

Run: `npm test -- --run src/components/invitation/invitation-experience.test.tsx src/components/invitation/envelope.test.tsx`
Expected: FAIL because Modern currently begins at the envelope and storage exceptions escape.

- [ ] **Step 3: Add safe storage helpers to EnvelopeGate**

Wrap `getItem` and `setItem` in `try/catch`, returning `false` when storage cannot be read and continuing the current-session `setOpened(true)` when it cannot be written. Add `id="invitation-envelope-button"` to the envelope button.

- [ ] **Step 4: Compose the approved entry flow**

Add `entered` state defaulting to `false`. For Modern, render `InvitationLanding` until Enter. After Enter, render the existing `EnvelopeGate`. Other preview themes continue to render `EnvelopeGate` immediately. Use a `requestAnimationFrame` focus helper after Enter/open: focus the envelope button if present, otherwise focus `#invitation-detail-heading`. Give the compact detail heading `id="invitation-detail-heading"` and `tabIndex={-1}`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run src/components/invitation/invitation-experience.test.tsx src/components/invitation/envelope.test.tsx`
Expected: all tests in both files PASS.

---

### Task 3: Compact Detail Header and Wedding Colors

**Files:**
- Modify: `src/components/invitation/invitation-experience.tsx`
- Modify: `src/components/invitation/invitation-experience.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing `WEDDING`, `Countdown`, quick-nav, and Modern theme tokens.
- Produces: `wedding-colors-section` with four accessible labeled swatches and a Modern `.detail-hero` header.

- [ ] **Step 1: Write the failing color and compact-header test**

After bypassing Landing and opening the invitation, assert the Detail hero has class `detail-hero`, then find the Wedding Colors section and assert these exact labels: `Chocolate Brown`, `Mocha`, `Dusty Pink`, `Blush Pink`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run src/components/invitation/invitation-experience.test.tsx`
Expected: FAIL because the Wedding Colors section and compact hero class are absent.

- [ ] **Step 3: Implement the Wedding Colors section**

Insert it between Venue and Gallery. Render semantic list items with a decorative swatch and visible label. Do not use `Dress Code`, `required`, or Thai copy asking guests to follow the palette.

- [ ] **Step 4: Compact the Modern details header**

Add `.detail-hero` CSS scoped to `[data-theme="modern-xi-club"]` with a desktop minimum height no greater than `560px` and mobile minimum height `0`. Retain personalized invitation name, names, date, venue, countdown, ambient music, and quick navigation.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- --run src/components/invitation/invitation-experience.test.tsx`
Expected: all InvitationExperience tests PASS.

---

### Task 4: Four-Image Reel and Accessible Lightbox

**Files:**
- Create: `src/components/invitation/wedding-gallery.tsx`
- Create: `src/components/invitation/wedding-gallery.test.tsx`
- Modify: `src/components/invitation/invitation-experience.tsx`
- Modify: `src/components/invitation/invitation-experience.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: four static gallery entries with `src` and Thai `alt` text.
- Produces: `WeddingGallery()` with horizontal cards and a `role="dialog"` lightbox supporting close, previous, next, Escape, ArrowLeft, and ArrowRight.

- [ ] **Step 1: Write failing gallery tests**

```tsx
render(<WeddingGallery />);
expect(screen.getAllByRole('button', { name: /เปิดภาพ/ })).toHaveLength(4);
fireEvent.click(screen.getAllByRole('button', { name: /เปิดภาพ/ })[0]);
expect(screen.getByRole('dialog', { name: 'ภาพของเรา' })).toBeInTheDocument();
fireEvent.keyDown(document, { key: 'ArrowRight' });
expect(screen.getByRole('dialog')).toHaveTextContent('2 / 4');
fireEvent.keyDown(document, { key: 'Escape' });
expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `npm test -- --run src/components/invitation/wedding-gallery.test.tsx`
Expected: FAIL because `WeddingGallery` does not exist.

- [ ] **Step 3: Implement WeddingGallery**

Define the exact array for photos 02, 03, 04, and 07. Track `activeIndex: number | null`, remember the opening button, register keyboard listeners only while open, wrap previous/next indices, restore trigger focus on close, and render the overlay with dialog semantics.

- [ ] **Step 4: Replace the single-image gallery and add CSS**

Replace the existing `galleryFeature` usage in `InvitationExperience` with `<WeddingGallery />`. Add horizontal `overflow-x: auto`, portrait card aspect ratio, `scroll-snap-type: x mandatory`, visible partial next card, lightbox fixed overlay, contained full image, and responsive controls. Remove obsolete `.gallery-feature` rules.

- [ ] **Step 5: Run focused gallery and experience tests and verify GREEN**

Run: `npm test -- --run src/components/invitation/wedding-gallery.test.tsx src/components/invitation/invitation-experience.test.tsx`
Expected: all tests in both files PASS.

---

### Task 5: Remove Guest Song Request Without Contract Migration

**Files:**
- Modify: `src/components/invitation/rsvp-form.tsx`
- Modify: `src/components/invitation/rsvp-form.test.tsx`

**Interfaces:**
- Consumes: existing `RsvpInput.songRequest: string` contract.
- Produces: the same POST payload shape without a user-visible song input.

- [ ] **Step 1: Write failing RSVP tests**

Assert `queryByLabelText('เพลงที่อยากฟังใน After Party')` is absent. Mock fetch, submit a valid Accept response, parse the request body, and assert `songRequest` exists and equals `''` for a new response.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run src/components/invitation/rsvp-form.test.tsx`
Expected: FAIL because the song-request input is still visible.

- [ ] **Step 3: Remove only the visible label/input**

Delete the song request `<label>` from the accepted form. Preserve `emptyInput.songRequest`, legacy initialization from `initial.songRequest`, and submission through the current `input` object.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- --run src/components/invitation/rsvp-form.test.tsx`
Expected: all RSVP form tests PASS.

---

### Task 6: Full Regression and Responsive Visual Verification

**Files:**
- Modify only if verification identifies a scoped defect in files already listed above.

**Interfaces:**
- Consumes: all deliverables from Tasks 1–5.
- Produces: verified Modern invitation experience at `/i/demo` and `/preview/modern-xi-club`.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`
Expected: all test files and tests PASS with zero failures.

- [ ] **Step 2: Run static and production checks**

Run: `npm run lint`
Expected: ESLint exits 0 with no errors.

Run: `npm run build`
Expected: Next.js compiles, TypeScript passes, and all routes finish generating.

- [ ] **Step 3: Check source hygiene**

Run: `git diff --check` and inspect `git status --short`.
Expected: no whitespace errors; only the wedding project files intended by this plan are changed. Because the project is currently untracked, also review the exact modified files directly rather than relying only on `git diff`.

- [ ] **Step 4: Verify the first-visit flow visually**

At a mobile viewport around 390×844 and a desktop viewport around 1440×900, open `/i/demo`, clear only its invitation envelope key, and verify: full ring portrait visible without foreground crop; readable overlay; Enter focuses the envelope; Open reveals compact Details; Wedding Colors appear; four gallery cards scroll and lightbox controls work.

- [ ] **Step 5: Verify the returning flow and reduced motion**

Reload `/i/demo` with the envelope key present. Verify Landing appears again and Enter skips the envelope. Emulate reduced motion and verify the landing zoom and long reveal transitions are disabled.

- [ ] **Step 6: Re-run verification after any visual correction**

If Step 4 or 5 required a code correction, re-run `npm test`, `npm run lint`, and `npm run build`; do not report completion using results from before the correction.
