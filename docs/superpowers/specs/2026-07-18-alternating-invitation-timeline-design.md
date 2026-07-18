# Alternating Invitation Timeline Design

**Date:** 2026-07-18
**Status:** Approved
**Theme:** Modern 囍 Club

## Objective

Refine the Modern invitation schedule into an alternating left-and-right vertical timeline while keeping its central axis visually balanced. Remove the introductory `OUR DAY` section so the invitation moves directly from the hero into the schedule.

## Selected Layout

The schedule kicker `TIMELINE · 04.12.2026` and heading `กำหนดการ` are horizontally centered above the timeline.

At desktop and tablet widths, the connector and circular event markers share one central vertical axis. Events alternate around that axis in chronological order:

1. Odd-numbered events place the event number, time, and title on the left.
2. Even-numbered events place the event number, time, and title on the right.
3. Copy aligns toward the center axis so each event stays visually connected to its marker.

At mobile widths, all event copy collapses to one side of the central marker rail. This preserves readable line lengths and avoids squeezing Thai titles into narrow alternating columns. The chronological DOM order remains unchanged at every viewport.

## Content Changes

- Remove the complete `OUR DAY` introductory section, including its kicker, heading, and supporting paragraph.
- Keep all schedule times, titles, icons, and their existing order unchanged.
- Keep the schedule section as the scroll destination for the hero cue.

## Hero Calendar Highlight

Replace the plain `04 · 12 · 26` date lockup with a prominent calendar-style control showing `04 / DEC / 2026`. The control is a link that downloads or opens the invitation's existing calendar event so the guest can add the wedding to their calendar.

Place a highlighted metadata strip immediately below it containing `วันศุกร์ · 15:00 น. · Celebce Venue`. The date control and metadata remain centered in the hero, use the Modern theme's existing palette, and expose a clear accessible name describing the add-to-calendar action.

## Scope and Boundaries

- Apply the alternating treatment only to the Modern theme.
- Keep both legacy themes unchanged.
- Preserve the existing colors, reveal animation, reduced-motion behavior, semantic `article` and `time` markup, and central connector treatment.
- Do not change music, envelope, quick navigation, RSVP, gallery, venue section, or other invitation sections beyond the specified hero calendar highlight.

## Accessibility and Responsive Behavior

- Schedule headings remain centered and readable.
- The hero calendar control has a visible focus state and an accessible link name.
- The connector and marker centers share the same x-coordinate.
- Visual alternation must not change keyboard, reading, or chronological DOM order.
- At 390×844, the timeline uses the mobile single-side layout without horizontal overflow.
- At 1440×900, event copy alternates clearly around the center axis without crossing the connector.
- Text and backgrounds maintain sufficient contrast, and the connector never passes through text glyphs.

## Verification

- Add focused regression coverage for the Modern alternating-timeline hook, centered schedule heading hook, and removal of the `OUR DAY` section.
- Add focused coverage for the calendar link target, accessible name, and highlighted date metadata.
- Preserve regression coverage proving legacy themes do not receive Modern timeline classes.
- Run the focused invitation experience tests, complete Vitest suite, ESLint, and Next.js production build.
- Visually verify alignment, alternation, mobile collapse, and lack of horizontal overflow at 390×844 and 1440×900.

## Out of Scope

- Alternating items on narrow mobile screens
- Changing event icons, wording, or times
- Adding timeline cards or navigation controls
- Restyling non-schedule sections beyond the specified hero calendar highlight
