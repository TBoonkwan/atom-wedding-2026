# Centered Invitation Timeline Design

**Date:** 2026-07-18
**Status:** Approved
**Theme:** Modern 囍 Club

## Objective

Center every visual part of the Modern invitation timeline horizontally so the vertical stepper reads as one balanced central column on mobile and desktop.

## Selected Layout

The Modern timeline keeps its chronological top-to-bottom order. The connector line, event number, circular symbol, time, and event title all share the horizontal center of the timeline section.

Each event is a centered vertical stack:

1. Event number
2. Circular symbol on the connector
3. Time
4. Event title

Text uses centered alignment. The connector remains visually continuous between events but must not pass through readable text. Spacing around the symbol and copy provides a clear boundary between consecutive steps.

The centered layout applies at every viewport. Desktop uses a constrained central column rather than stretching event content across the section; mobile uses the same structure with tighter spacing and the existing smaller marker size.

## Alternatives Considered

1. **Selected: center the connector, number, marker, time, and title as one stacked column.** This gives the strongest symmetry and matches the requested all-centered treatment.
2. **Center only the overall stepper while keeping each event's copy left-aligned.** This preserves a conventional timeline row, but the individual elements do not share one central axis.
3. **Alternate event copy left and right of a centered connector.** This uses desktop width well but is visually busier and becomes inconsistent on mobile.

## Scope and Boundaries

- Keep the existing `TIMELINE` data, order, wording, and semantic `article`/`time` markup.
- Apply the centered treatment only to `.timeline-stepper` in the Modern theme.
- Keep both legacy themes unchanged.
- Preserve the existing vertical connector, colors, reveal animation, reduced-motion behavior, and absence of horizontal scrolling.
- Do not change music, envelope, navigation, RSVP, gallery, venue, or other invitation sections.

## Accessibility and Responsive Behavior

- Timeline text remains readable at 390×844 and 1440×900.
- The connector and marker centers must share the same x-coordinate.
- The line must not reduce text contrast or cross the time/title glyphs.
- The page and timeline must not introduce horizontal overflow.
- Chronological DOM order remains identical to visual order.

## Verification

- Add a focused regression test for the Modern centered-stepper markup hook while preserving the existing legacy-theme protection.
- Run the focused invitation experience tests, complete Vitest suite, ESLint, and Next.js production build.
- Visually verify marker/connector/copy alignment and no overflow at 390×844 and 1440×900.

## Out of Scope

- Alternating left/right event layouts
- Horizontal timeline or carousel behavior
- Changing event icons, copy, or schedule times
- Adding cards or navigation controls
