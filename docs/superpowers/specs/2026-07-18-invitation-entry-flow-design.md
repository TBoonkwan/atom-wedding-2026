# Wedding Invitation Entry Flow Design

**Date:** 2026-07-18
**Status:** Approved
**Selected theme:** Modern 囍 Club

## Objective

Turn the black-and-white ring portrait into a cinematic entry point for every invitation visit, preserve the tactile envelope moment for first-time guests, and make the detail page shorter while adding the supplied wedding colors and a compact photo gallery.

## Approved Experience

The invitation remains a single tokenized route at `/i/[token]` and uses three visual states in one client experience:

1. **Landing:** Every visit begins with `/gallery/photo-08.jpg`, the couple's names, the wedding date, and an `Enter to our wedding` button.
2. **Envelope:** On the first visit, Enter reveals the existing interactive envelope. Opening it stores the current invitation's opened state.
3. **Details:** If that invitation was opened before, Enter skips the envelope and transitions directly to the details. A first-time guest reaches the same details after opening the envelope.

The landing image must never be center-cropped. On wide screens it can occupy the available landscape frame naturally. On narrow screens, the complete 3:2 image is shown with `object-fit: contain` over a softly blurred, darkened copy of the image that fills unused space. Names, date, and the entry button stay legible over a contrast-safe overlay.

The landing itself is intentionally not persisted as dismissed. Returning guests see it on every visit, but never need to open the envelope again after the stored envelope state exists.

## Detail Page Layout

Because the landing now establishes the visual mood, the existing full-height detail hero becomes a compact event header. It retains the personalized guest name, couple names, date, venue, countdown, ambient-music control, and quick navigation without repeating a second full-screen introduction.

The detail page keeps these sections in a compact order:

1. Event introduction
2. Timeline
3. Venue and directions
4. Wedding Colors
5. Photo gallery
6. RSVP or saved RSVP summary
7. Check-in note

Existing behavior remains unchanged for RSVP status editing, the optional payment QR after Reject, Calendar actions shown only after Accept, and the host/check-in systems.

## Wedding Colors

Add a `Wedding Colors` section using the four colors supplied in `public/brand/palette.png`:

- Chocolate Brown
- Mocha
- Dusty Pink
- Blush Pink

The swatches use the supplied project values: Chocolate Brown `#553725`, Mocha `#987863`, Dusty Pink `#d1afa6`, and Blush Pink `#d5acab`. The section displays four labeled swatches only. It does not say that the colors are mandatory and does not ask guests to comply with a dress code.

## Gallery

The detail gallery no longer repeats the landing portrait. It uses four supplied portraits selected for visual variety:

- `/gallery/photo-02.jpg` — black attire, close couple portrait
- `/gallery/photo-03.jpg` — formal studio portrait
- `/gallery/photo-04.jpg` — red Chinese-inspired portrait
- `/gallery/photo-07.jpg` — white wedding portrait

On desktop, the gallery is a horizontally scrollable portrait reel with visible next-card affordance. On mobile, cards snap horizontally and remain finger-scrollable. Selecting any image opens an accessible lightbox with the full image, previous/next controls, close button, Escape-to-close, backdrop click, and keyboard arrow navigation. Images use responsive `next/image` sizing and lazy loading.

## RSVP Song Request Removal

Remove the visible `เพลงที่อยากฟังใน After Party` field from the guest RSVP form. Keep the existing `songRequest` field in the TypeScript/domain/API/database contracts for backward compatibility and to avoid a database migration. New responses send an empty value; editing an older response preserves its stored value without displaying it. The ambient background music control is unrelated and remains available.

## Component Boundaries

- `InvitationExperience` owns the current invitation data, landing-entry state, and composition of Landing → Envelope → Details.
- A focused landing component renders the full-viewport image, overlay copy, and Enter action. It receives no token and performs no network writes.
- `EnvelopeGate` remains responsible only for envelope persistence and opening. Its existing invitation-scoped storage key continues to decide whether the envelope is skipped after Enter.
- A focused gallery/lightbox component owns selected-image state, keyboard controls, and dialog semantics.
- `RsvpForm` removes the song input while keeping the current API payload shape.

No new public route, analytics script, cookie, or token-bearing third-party request is introduced.

## Motion and Accessibility

- Landing image uses a subtle slow zoom; Enter cross-fades to the next state.
- Envelope animation remains unchanged except for the transition into it.
- After Enter, focus moves to the envelope button for a first-time guest or to the compact detail heading for a returning guest. Opening the envelope also moves focus to the compact detail heading.
- Enter and envelope interactions use real buttons and work with keyboard input.
- Lightbox exposes dialog semantics, an accessible name, keyboard controls, and restores focus on close.
- `prefers-reduced-motion` disables slow zoom and reduces state transitions to near-instant fades.
- Text overlays meet readable contrast against both bright and dark parts of the photograph.

## Failure and Edge Cases

- A guest with a missing or invalid invitation token still receives the existing 404 behavior before the client experience renders.
- Landing image loading does not block the Enter button or personalized invitation data.
- Local storage being unavailable must not block the guest; the envelope may reappear on a later visit, but details remain reachable in the current visit.
- Gallery image failures leave the remaining cards and lightbox controls usable.
- Existing RSVP network errors continue to show the current inline error message.

## Verification

Add focused tests for:

- Landing is the first screen on every mount.
- Enter shows the envelope for an invitation without stored open state.
- Enter skips to details when that invitation's envelope state is already stored.
- Opening the envelope still reveals details and persists the opened state.
- Wedding Colors renders all four supplied labels.
- Gallery renders exactly the four selected images and supports open/close plus keyboard navigation.
- RSVP no longer displays the After Party song request field and still submits a schema-compatible payload.
- Existing Accept-only Calendar behavior remains intact.

Run the complete Vitest suite, ESLint, Next.js production build, and responsive visual checks at desktop and mobile widths. Visual checks must confirm that the entire ring portrait remains visible on the landing screen and that the detail page is shorter than the current full-height-hero version.

## Out of Scope

- Changing the ambient music track or license handling
- Removing the legacy `song_request` database column or historical values
- Changing host authentication, guest importing, table planning, or check-in behavior
- Adding more than four detail-gallery images
- Creating a second details URL
