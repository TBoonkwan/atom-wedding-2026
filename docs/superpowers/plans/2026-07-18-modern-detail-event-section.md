# Modern Detail Event Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the Modern invitation's event date, venue, countdown, and scroll cue from the couple-name hero so the opening composition has more breathing room.

**Architecture:** Keep the existing data sources and `Countdown` component, but render Modern event metadata in a dedicated semantic section between the hero and `main`. Legacy themes continue rendering their date, venue, countdown, and scroll cue inside the hero. Add theme-scoped Global CSS for the new section and adjust the existing compact selectors to target it.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, Global CSS, Vitest, Testing Library

## Global Constraints

- Apply the split only to the `modern-xi-club` theme.
- Do not change couple names, event copy, date, time, venue, countdown logic, calendar destinations, or scroll target.
- Keep the landing page, envelope, schedule, gallery, RSVP, and footer behavior unchanged.
- Preserve keyboard access, accessible naming, focus treatment, reduced-motion behavior, and mobile layout without horizontal overflow.

---

### Task 1: Split the Modern event metadata into its own section

**Files:**
- Modify: `src/components/invitation/invitation-experience.test.tsx:62-82,151-170`
- Modify: `src/components/invitation/invitation-experience.tsx:183-234`
- Modify: `src/app/globals.css:176-216,304-318`

**Interfaces:**
- Consumes: `heroCalendarHref: string`, `Countdown(): JSX.Element`, and the existing `#schedule` anchor target.
- Produces: a Modern-only `<section className="event-details-section" aria-labelledby="event-details-heading">` with a visually hidden heading, plus unchanged legacy hero metadata.

- [ ] **Step 1: Write the failing structure and legacy-isolation tests**

Replace the existing Modern calendar-highlight assertions with hierarchy assertions and extend the legacy-theme parameterized test:

```tsx
const hero = document.getElementById('invitation-detail-heading')?.closest('header');
const eventDetails = screen.getByRole('region', { name: 'ข้อมูลวันงาน' });
const calendar = within(eventDetails).getByRole('link', {
  name: 'เพิ่มงานแต่งงานวันที่ 4 ธันวาคม 2569 ลง Google Calendar',
});

expect(hero).not.toContainElement(calendar);
expect(hero?.querySelector('.countdown-grid')).not.toBeInTheDocument();
expect(hero).not.toHaveTextContent('วันศุกร์ · 15:00 น. · Celebce Venue');
expect(within(eventDetails).getByText('วันศุกร์ · 15:00 น. · Celebce Venue'))
  .toHaveClass('hero-event-highlight');
expect(within(eventDetails).getByLabelText('เวลานับถอยหลังถึงวันงาน'))
  .toHaveClass('countdown-grid');
expect(within(eventDetails).getByRole('link', { name: 'เลื่อนดูรายละเอียด ↓' }))
  .toHaveAttribute('href', '#schedule');
expect(calendar).toHaveAttribute('href', '#google');
expect(calendar).toHaveClass('hero-calendar');
expect(calendar).toHaveTextContent('04/DEC/2026');
expect(eventDetails.compareDocumentPosition(
  screen.getByRole('heading', { name: 'กำหนดการ' }).closest('section') as HTMLElement,
) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
```

Add to the legacy theme test:

```tsx
expect(screen.queryByRole('region', { name: 'ข้อมูลวันงาน' })).not.toBeInTheDocument();
expect(document.querySelector('.hero-section .countdown-grid')).toBeInTheDocument();
expect(document.querySelector('.hero-section .scroll-cue')).toHaveAttribute('href', '#schedule');
```

- [ ] **Step 2: Run the focused tests and confirm the new test fails**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: FAIL because no accessible region named `ข้อมูลวันงาน` exists and Modern metadata still lives in the header.

- [ ] **Step 3: Move the Modern markup while preserving the legacy branch**

In `InvitationExperience`, leave the legacy metadata inside the header and render the Modern block after it:

```tsx
{!isModernTheme ? (
  <>
    <div className="date-lockup">
      <span>04</span><i>·</i><span>12</span><i>·</i><span>26</span>
    </div>
    <p className="venue-line">วันศุกร์ · 15:00 น. · Celebce Venue</p>
    <Countdown />
    <a className="scroll-cue" href="#schedule">เลื่อนดูรายละเอียด ↓</a>
  </>
) : null}
</header>

{isModernTheme ? (
  <section className="event-details-section" aria-labelledby="event-details-heading">
    <h2 className="sr-only" id="event-details-heading">ข้อมูลวันงาน</h2>
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
    <p className="venue-line hero-event-highlight">วันศุกร์ · 15:00 น. · Celebce Venue</p>
    <Countdown />
    <a className="scroll-cue" href="#schedule">เลื่อนดูรายละเอียด ↓</a>
  </section>
) : null}
```

- [ ] **Step 4: Style the semantic split for desktop and mobile**

Add a reusable visually-hidden utility and Modern-only event section styles, while retargeting the compact countdown selectors:

```css
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

[data-theme="modern-xi-club"] .detail-hero { min-height: 560px; padding-top: 72px; padding-bottom: 64px; }
[data-theme="modern-xi-club"] .event-details-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 42px;
  text-align: center;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 52%, var(--paper)), var(--paper));
  border-block: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
}
[data-theme="modern-xi-club"] .event-details-section .hero-calendar { margin-top: 0; }
[data-theme="modern-xi-club"] .event-details-section .countdown-grid { margin: 22px 0 14px; }
[data-theme="modern-xi-club"] .event-details-section .countdown-unit { min-width: 68px; padding: 10px 8px; }
[data-theme="modern-xi-club"] .event-details-section .scroll-cue { margin-top: 0; }
```

Replace the current mobile `.detail-hero` spacing and add compact event-section spacing:

```css
[data-theme="modern-xi-club"] .detail-hero { min-height: 0; padding-top: 64px; padding-bottom: 54px; }
[data-theme="modern-xi-club"] .event-details-section { padding: 38px 18px 34px; }
```

- [ ] **Step 5: Run the focused test and confirm it passes**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: PASS for all tests in `invitation-experience.test.tsx`.

- [ ] **Step 6: Run full automated verification**

Run: `npm test && npm run lint && npm run build`

Expected: all Vitest files pass, ESLint exits 0, and the Next.js production build completes successfully.

- [ ] **Step 7: Visually verify both responsive layouts**

Run: `npm run dev`, open the Modern invitation, pass Landing → Envelope → Details, and inspect at approximately 980×1080 and 390×844.

Expected: the hero ends after the descriptor with generous negative space; the event section visibly begins below it; date, venue, countdown, and scroll cue remain centered; no horizontal overflow or content overlap appears.

- [ ] **Step 8: Commit the implementation**

```bash
git add src/components/invitation/invitation-experience.test.tsx src/components/invitation/invitation-experience.tsx src/app/globals.css
git commit -m "feat: separate modern event details from hero"
```
