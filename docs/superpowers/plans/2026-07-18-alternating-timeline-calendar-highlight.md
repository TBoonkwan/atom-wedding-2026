# Alternating Timeline and Calendar Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Modern invitation's centered single-column schedule with a centered-heading alternating timeline, remove the `OUR DAY` section, and turn the hero date into an accessible Google Calendar highlight.

**Architecture:** Keep `InvitationExperience` as the presentation boundary and add only semantic class hooks needed by the Modern theme. Reuse the existing server-side calendar URL builder so public and personalized invitations receive the same Google Calendar destination; retain all legacy-theme markup and styling behavior through Modern-scoped CSS.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, Vitest, Testing Library

## Global Constraints

- Apply the alternating treatment only to the Modern theme.
- Keep both legacy themes unchanged.
- Desktop and tablet items alternate around one centered connector; mobile at `max-width: 540px` collapses all copy to one side.
- Keep the timeline's chronological DOM order and existing schedule content unchanged.
- Remove the complete `OUR DAY` introductory section.
- The hero calendar control shows `04 / DEC / 2026`, links to Google Calendar, has a visible focus state, and exposes a descriptive accessible name.
- Do not add dependencies or change music, envelope, quick navigation, RSVP, gallery, or venue behavior.

---

### Task 1: Calendar URL and Hero Calendar Control

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/invitation/invitation-experience.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/invitation/invitation-experience.test.tsx`

**Interfaces:**
- Consumes: `buildCalendarUrls(token: string, origin: string): { google: string; ics: string }` from `src/lib/domain/calendar.ts`
- Produces: public invitation prop `calendarLink: string`; Modern hero link `.hero-calendar` with Google Calendar destination and accessible name

- [ ] **Step 1: Write the failing component tests**

Update the public render to provide `calendarLink="#public-calendar"`. Add this focused test:

```tsx
it('highlights the Modern date as an add-to-calendar link', () => {
  render(
    <InvitationExperience
      theme="modern-xi-club"
      token="calendar-highlight-demo"
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
      preview
    />,
  );

  openModernInvitation();

  const calendar = screen.getByRole('link', {
    name: 'เพิ่มงานแต่งงานวันที่ 4 ธันวาคม 2569 ลง Google Calendar',
  });
  expect(calendar).toHaveAttribute('href', '#google');
  expect(calendar).toHaveClass('hero-calendar');
  expect(calendar).toHaveTextContent('04/DEC/2026');
  expect(screen.getByText('วันศุกร์ · 15:00 น. · Celebce Venue'))
    .toHaveClass('hero-event-highlight');
});
```

In the existing public invitation test, assert the public link is used:

```tsx
expect(screen.getByRole('link', {
  name: 'เพิ่มงานแต่งงานวันที่ 4 ธันวาคม 2569 ลง Google Calendar',
})).toHaveAttribute('href', '#public-calendar');
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: FAIL because `calendarLink` and the `.hero-calendar` markup do not exist.

- [ ] **Step 3: Supply the public Google Calendar URL**

Update `src/app/page.tsx`:

```tsx
import { InvitationExperience } from '@/components/invitation/invitation-experience';
import { buildCalendarUrls } from '@/lib/domain/calendar';

export default function Home() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const calendarLink = buildCalendarUrls('public-invitation', origin).google;

  return (
    <InvitationExperience
      theme="modern-xi-club"
      mode="public"
      calendarLink={calendarLink}
    />
  );
}
```

- [ ] **Step 4: Add the calendar prop and Modern hero markup**

Extend the public prop and derive one URL for both modes:

```tsx
type PublicInvitationExperienceProps = {
  theme: DraftTheme;
  mode: 'public';
  calendarLink: string;
};

const heroCalendarHref = isPersonalized
  ? props.calendarLinks.google
  : props.calendarLink;
```

Replace the Modern date lockup and venue line with this conditional, retaining the existing legacy markup in the `else` branch:

```tsx
{isModernTheme ? (
  <>
    <a
      className="hero-calendar"
      href={heroCalendarHref}
      target="_blank"
      rel="noreferrer"
      aria-label="เพิ่มงานแต่งงานวันที่ 4 ธันวาคม 2569 ลง Google Calendar"
    >
      <CalendarDays size={22} aria-hidden="true" />
      <span>04</span><i aria-hidden="true">/</i>
      <span>DEC</span><i aria-hidden="true">/</i>
      <span>2026</span>
    </a>
    <p className="venue-line hero-event-highlight">
      วันศุกร์ · 15:00 น. · Celebce Venue
    </p>
  </>
) : (
  <>
    <div className="date-lockup">
      <span>04</span><i>·</i><span>12</span><i>·</i><span>26</span>
    </div>
    <p className="venue-line">วันศุกร์ · 15:00 น. · Celebce Venue</p>
  </>
)}
```

- [ ] **Step 5: Add the calendar highlight CSS**

Add Modern-scoped styles in `src/app/globals.css` near the existing detail-hero rules:

```css
[data-theme="modern-xi-club"] .hero-calendar {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 18px;
  border: 1px solid color-mix(in srgb, var(--accent) 58%, transparent);
  border-radius: 18px;
  color: var(--ink);
  background: color-mix(in srgb, var(--surface) 88%, var(--accent-soft));
  box-shadow: 0 14px 34px #160a0824;
  font: 24px var(--serif);
  letter-spacing: .05em;
  text-decoration: none;
}
[data-theme="modern-xi-club"] .hero-calendar i { color: var(--accent); font-style: normal; }
[data-theme="modern-xi-club"] .hero-calendar:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 4px;
}
[data-theme="modern-xi-club"] .hero-event-highlight {
  margin: 8px 0 0;
  padding: 7px 13px;
  border-radius: 99px;
  color: var(--ink);
  background: color-mix(in srgb, var(--accent-soft) 72%, transparent);
}
```

Inside `@media (max-width: 540px)`, add:

```css
[data-theme="modern-xi-club"] .hero-calendar {
  gap: 7px;
  max-width: calc(100vw - 48px);
  padding: 10px 13px;
  font-size: 20px;
}
[data-theme="modern-xi-club"] .hero-calendar svg { width: 19px; height: 19px; }
[data-theme="modern-xi-club"] .hero-event-highlight {
  max-width: calc(100vw - 48px);
  font-size: 11px;
  letter-spacing: .03em;
}
```

- [ ] **Step 6: Run focused tests and verify they pass**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: all invitation experience tests PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/app/page.tsx src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx src/app/globals.css
git commit -m "feat: highlight invitation calendar date"
```

---

### Task 2: Alternating Schedule and Intro Removal

**Files:**
- Modify: `src/components/invitation/invitation-experience.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/invitation/invitation-experience.test.tsx`

**Interfaces:**
- Consumes: existing `TIMELINE` array and semantic `article` / `time` markup
- Produces: `.schedule-section`, `.timeline-stepper-alternating`, odd/even desktop placement, and one-sided mobile placement

- [ ] **Step 1: Update the Modern timeline regression test so it fails**

Replace the centered-stepper expectations with:

```tsx
const schedule = screen.getByRole('heading', { name: 'กำหนดการ' }).closest('section');
const timeline = schedule?.querySelector('.timeline-list');
expect(schedule).toHaveClass('schedule-section');
expect(timeline).toHaveClass('timeline-stepper', 'timeline-stepper-alternating');
expect(timeline).not.toHaveClass('timeline-stepper-centered');
expect(screen.queryByText('OUR DAY')).not.toBeInTheDocument();
expect(Array.from(timeline?.querySelectorAll('time') ?? []).map((time) => time.textContent))
  .toEqual(['15:00', '15:40', '17:00', '18:00–20:00', '20:00–22:00']);
```

Extend the legacy-theme regression with:

```tsx
expect(timeline).not.toHaveClass('timeline-stepper-alternating');
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: FAIL because the old centered class and `OUR DAY` section are still present.

- [ ] **Step 3: Remove the intro and add semantic class hooks**

Delete the entire `.intro-card` section. Update the schedule markup:

```tsx
<section
  className={`content-section${isModernTheme ? ' schedule-section' : ''}`}
  id="schedule"
  data-reveal
>
  <p className="section-kicker">TIMELINE · 04.12.2026</p>
  <h2>กำหนดการ</h2>
  <div className={`timeline-list${isModernTheme ? ' timeline-stepper timeline-stepper-alternating' : ''}`}>
```

Keep every `TIMELINE.map` item and its DOM order unchanged.

- [ ] **Step 4: Replace the centered Modern CSS with the alternating grid**

Replace `.timeline-stepper-centered` rules with Modern-scoped `.timeline-stepper-alternating` rules that:

```css
[data-theme="modern-xi-club"] .schedule-section > .section-kicker,
[data-theme="modern-xi-club"] .schedule-section > h2 { text-align: center; }
[data-theme="modern-xi-club"] .timeline-stepper-alternating {
  position: relative;
  width: min(780px, 100%);
  margin-inline: auto;
  padding: 0;
  border: 0;
}
[data-theme="modern-xi-club"] .timeline-stepper-alternating::before {
  content: "";
  position: absolute;
  top: 43px;
  bottom: 43px;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: linear-gradient(var(--accent), color-mix(in srgb, var(--accent) 30%, transparent));
}
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item {
  position: relative;
  display: grid;
  grid-template: auto auto / minmax(0, 1fr) 64px minmax(0, 1fr);
  column-gap: 24px;
  min-height: 132px;
  padding: 18px 0;
  border: 0;
}
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-symbol {
  z-index: 1;
  grid-area: 1 / 2 / span 2;
  place-self: center;
}
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-index,
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item > div {
  grid-column: 1;
  justify-self: end;
  text-align: right;
}
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-index { grid-row: 1; align-self: end; }
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item > div { grid-row: 2; }
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item:nth-child(even) .timeline-index,
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item:nth-child(even) > div {
  grid-column: 3;
  justify-self: start;
  text-align: left;
}
```

Retain the current marker dimensions, border, surface, and shadow. Remove obsolete `.timeline-stepper-centered` selectors.

- [ ] **Step 5: Add the one-sided mobile layout**

Inside `@media (max-width: 540px)`, set the rail to the left and all copy to the right:

```css
[data-theme="modern-xi-club"] .timeline-stepper-alternating::before {
  top: 36px;
  bottom: 36px;
  left: 22px;
}
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item {
  grid-template: auto auto / 44px minmax(0, 1fr);
  column-gap: 14px;
  min-height: 112px;
  padding: 14px 0;
}
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-symbol {
  grid-area: 1 / 1 / span 2;
}
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-index,
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item > div,
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item:nth-child(even) .timeline-index,
[data-theme="modern-xi-club"] .timeline-stepper-alternating .timeline-item:nth-child(even) > div {
  grid-column: 2;
  justify-self: start;
  text-align: left;
}
```

- [ ] **Step 6: Run focused tests and verify they pass**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: all invitation experience tests PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx src/app/globals.css
git commit -m "feat: alternate invitation timeline steps"
```

---

### Task 3: Full Verification and Responsive QA

**Files:**
- Verify only; modify Task 1 or Task 2 files if a check finds a defect

**Interfaces:**
- Consumes: completed hero calendar and alternating schedule
- Produces: automated and browser evidence that the feature is ready for local review

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: 100% of tests PASS, ESLint exits 0, and the Next.js production build exits 0.

- [ ] **Step 2: Verify mobile at 390×844**

Open `http://localhost:3000`, enter the invitation, open the envelope, and verify:

- Calendar highlight stays inside the viewport and exposes the add-to-calendar link.
- `OUR DAY` is absent.
- Schedule kicker and heading are centered.
- Every timeline item is on the right of the left-side rail.
- Event times remain chronological and neither the page nor timeline has horizontal overflow.

- [ ] **Step 3: Verify desktop at 1440×900**

Verify:

- Calendar highlight is centered and visually emphasized.
- Schedule kicker and heading are centered.
- Odd event copy is left of the centered connector and even event copy is right.
- All markers share the connector's x-coordinate and text never crosses the connector.

- [ ] **Step 4: Check browser diagnostics**

Confirm no new console errors or warnings occur during entry, envelope open, scrolling, or calendar-link inspection.

- [ ] **Step 5: Commit any verification fixes**

If verification required a correction, stage only the affected files and commit with:

```bash
git commit -m "fix: refine invitation timeline responsiveness"
```

If no correction was required, do not create an empty commit.
