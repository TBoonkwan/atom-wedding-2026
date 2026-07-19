# Afterdark Full Draft Design

## Goal

Extend the approved Afterdark Ticket Club draft into a complete scrollable wedding landing-page preview while keeping the current production invitation unchanged.

## Scope

The existing `/drafts/afterdark-ticket` route becomes the full preview. The Neon Editorial and Pop Postcard routes remain first-viewport concept drafts. The production `/`, personalized invitation, RSVP APIs, music, envelope, host, check-in, and data flows remain unchanged.

## Page structure

1. **Admission hero** — retain the approved cinematic photograph, chrome names, ticket date, `囍` stamp, numbered details, barcode, and primary anchor.
2. **Event pass strip** — retain the four shared facts immediately after the hero.
3. **Running order** — render every item from the existing `TIMELINE` domain data as numbered ticket rows with time, Chinese event mark, and Thai title.
4. **Venue** — use the existing `WEDDING` venue, address, and map URL in a split ticket/map-grid composition with a native external map link.
5. **Wedding colors** — present Chocolate Brown, Mocha, Dusty Pink, and Blush Pink as numbered circular admission tokens, preserving the real wedding palette within the darker club language.
6. **Gallery** — show four existing wedding photographs in an editorial two-column contact-sheet layout with accurate Thai alternative text and responsive `next/image` sizing.
7. **RSVP preview** — show the three real answer directions as a clearly labelled, non-interactive preview and explain that the working form remains on each personalized invitation link.
8. **Closing ticket** — finish with the `NP` monogram, date, and a back-to-top link.

## Architecture

Add a focused `AfterdarkFullSections` component beside the existing draft component and render it only when `theme === 'afterdark-ticket'`. It consumes `TIMELINE` and `WEDDING` directly from the existing domain module and keeps gallery metadata local because the four-image editorial selection belongs only to this draft.

All new selectors remain scoped under `.landing-draft[data-draft="afterdark-ticket"]`. CSS extends the existing draft stylesheet with reusable full-section, ticket-row, venue, palette, gallery, RSVP-preview, and closing-ticket blocks. No client state or new dependency is introduced.

## Interaction and accessibility

- The hero CTA continues to focus the event pass strip.
- The map and back-to-top controls are native links with visible focus styling inherited from the draft surface.
- The schedule uses semantic ordered-list structure; venue and gallery use semantic sections and headings.
- Gallery images use meaningful Thai alternative text, explicit dimensions, and responsive `sizes`.
- RSVP choices are display-only list items, not fake buttons or form controls.
- Decorative numbering, grid lines, barcode motifs, and `囍` stamps are hidden from assistive technology where appropriate.
- Existing reduced-motion behavior applies to the extended page.

## Responsive behavior

- Desktop uses asymmetric two-column tickets and contact-sheet gallery rhythm.
- At 960 px, split sections stack without changing reading order.
- At 720 px and below, ticket rows, palette, gallery, and event facts reduce to one or two columns with no horizontal overflow.
- Content remains legible at 320 px.

## Testing and verification

Component tests verify that only Afterdark renders the full sections, every domain timeline item appears, venue/map data is correct, all four gallery images have accessible names, the RSVP surface is explicitly a preview, and the closing back-to-top link targets the page root. Final verification runs the focused test, complete Vitest suite, ESLint, and production build.
