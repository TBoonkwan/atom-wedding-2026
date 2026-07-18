# Modern Detail Event Section Design

**Date:** 2026-07-18
**Status:** Approved
**Theme:** Modern 囍 Club

## Objective

Give the couple-name composition more breathing room on the invitation detail page by separating the event date, venue, and countdown from the opening hero.

## Selected Layout

The Modern detail page becomes two visually distinct blocks before the schedule:

1. **Couple hero:** Keep the eyebrow, 囍 mark, invitation salutation, English and Thai couple names, and the existing short descriptor. The hero no longer contains the date card, venue line, countdown, or scroll cue.
2. **Event details section:** Place the linked date card, weekday/time/venue line, countdown, and `เลื่อนดูรายละเอียด ↓` cue in a new section immediately after the hero and before the schedule.

The event details section uses a subtly different dark surface and a restrained divider or boundary so it reads as a continuation of the invitation rather than another full content card. Its contents remain centered and keep the existing visual language.

## Component and Data Boundaries

The change stays inside `InvitationExperience` and the Modern-theme styles:

- Extract the existing Modern event metadata markup into a semantic section rendered directly after the header.
- Continue using `heroCalendarHref` and the existing `Countdown` component; no event data or link behavior changes.
- Keep the non-Modern date lockup and venue line in their current hero layout.
- Give the new Modern section a dedicated class so spacing changes do not affect the legacy themes.
- Keep `#schedule` on the schedule section. The scroll cue continues to target it from the new event section.

## Responsive Behavior

On desktop, the couple hero gets generous vertical spacing while the event section remains compact enough to show that it belongs to the same opening sequence. On mobile, the new section stacks the date card, venue line, and four-column countdown without horizontal overflow. Existing small-screen sizing for the date card and countdown remains the baseline and may be adjusted only as needed for separation and rhythm.

## Accessibility and Interaction

- The linked date remains a keyboard-accessible link with the current accessible label and visible focus style.
- The new event block uses a semantic `section` with an accessible heading available to assistive technology without adding a visually heavy heading.
- Countdown semantics and reduced-motion behavior remain unchanged.
- Moving the scroll cue does not change its target or wording.

## Alternatives Considered

1. **Selected: move all event metadata into a new section.** This creates the clearest hierarchy and gives the couple names meaningful negative space.
2. **Move only the countdown.** This is a smaller change, but the date and venue still crowd the couple-name composition.
3. **Keep one hero and reduce sizes.** This shortens the page, but preserves the mixed hierarchy that makes the current layout feel dense.

## Verification

Update focused component tests to confirm that, for the Modern theme:

- the couple hero does not contain the linked date, venue line, countdown, or scroll cue;
- the new event details section contains those four elements and appears before the schedule;
- the calendar link keeps its current destination and accessible label;
- the two non-Modern themes retain their existing hero date layout and do not render the new Modern event section.

Run the focused invitation tests, the full Vitest suite, ESLint, and the Next.js production build. Visually verify the open invitation at desktop and mobile widths against the supplied screenshot, checking hierarchy, spacing, focus treatment, and horizontal overflow.

## Out of Scope

- Changing couple names, event copy, date, time, venue, or countdown logic
- Redesigning the landing page, envelope, schedule, gallery, RSVP, or footer
- Applying the split layout to the Blush Shanghai or Tea to Toast themes
