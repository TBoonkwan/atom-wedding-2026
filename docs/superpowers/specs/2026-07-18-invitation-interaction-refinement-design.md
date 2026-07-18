# Invitation Interaction Refinement Design

**Date:** 2026-07-18
**Status:** Approved
**Theme:** Modern 囍 Club

## Objective

Make the invitation details easier to scan on mobile, remove navigation that covers content, let the music begin naturally after the guest enters, and restore the envelope-opening moment on every visit.

## Selected Experience

The invitation keeps its existing three-stage sequence:

1. The landing portrait and `Enter to our wedding` button appear on every visit.
2. Pressing Enter starts the ambient music and transitions to the envelope.
3. The guest opens the envelope to reveal the invitation details.

The envelope appears on every visit. Its open state is no longer persisted or used to skip the envelope. The current visit still remembers that the envelope has been opened so the details remain visible while the page stays mounted.

## Timeline

Replace the Modern theme's horizontally scrolling timeline cards with a single vertical stepper. Each event is one step containing its number, icon, time, and title. A continuous vertical line connects the step markers from the first event to the last.

The stepper is read in chronological order from top to bottom on every viewport. It must not require horizontal scrolling. Desktop may use more generous spacing, but it keeps the same vertical structure as mobile.

## Section Navigation

Remove the Modern theme's quick-navigation bar entirely, including the links to schedule, venue, gallery, and RSVP. Do not move it to the bottom of the viewport.

The existing `เลื่อนดูรายละเอียด ↓` link in the detail header remains as the single scroll cue. Removing the persistent navigation avoids covering content and keeps the invitation visually calm.

## Ambient Music

Pressing `Enter to our wedding` is the explicit guest interaction used to start the existing ambient Web Audio sequence. Music continues while the guest views the envelope and details.

Remove the text-heavy play/pause control. While music is playing, show a small fixed mute button with a clear accessible label. Pressing it stops the music and removes the control for the rest of that mounted visit; the music must not restart automatically after the guest mutes it.

If the browser or device refuses audio playback or Web Audio initialization fails, the invitation continues silently without an error screen. No audio preference is persisted across visits.

## Envelope Behavior

`EnvelopeGate` becomes session-local UI state only. It no longer reads from or writes to `localStorage`, and the experience no longer treats accepted or previously answered invitations as already open.

Every fresh page load follows Landing → Envelope → Details. Opening the envelope moves focus to the detail heading as it does today. Storage failures are no longer relevant to envelope access because storage is not used.

## Component Boundaries and Data Flow

- `InvitationExperience` owns the landing state and requests music playback when Enter is pressed.
- `AmbientMusic` exposes an imperative start action to its parent, owns Web Audio resources, and renders only the compact mute control while audio is active.
- `EnvelopeGate` owns only the current mount's open/closed state and reports when the envelope opens.
- Timeline markup remains inside `InvitationExperience`; Modern-theme CSS changes it into the vertical stepper without affecting the two legacy themes.
- The Modern quick-navigation markup is removed rather than hidden with CSS.

Audio resources and timers must be cleaned up when the component unmounts or when the guest mutes the music.

## Accessibility and Motion

- Enter remains a real button and is the only action that attempts to start audio.
- The mute control is a real button with an accessible Thai label, visible focus styling, and a touch target of at least 44 by 44 CSS pixels.
- The timeline remains semantic chronological content using articles and `time` elements.
- The envelope button and post-open focus behavior remain keyboard accessible.
- Existing reduced-motion handling continues to disable or shorten transitions; it does not disable audio because motion and sound preferences are separate.

## Alternatives Considered

1. **Selected: remove quick navigation, auto-start after Enter, and show the envelope every visit.** This gives the cleanest layout and a consistent ceremonial entry.
2. **Bottom-pinned navigation.** Easier to reach but still covers content, competes with mobile browser controls, and adds visual weight throughout the page.
3. **Persist the envelope and keep a full music toggle.** Returning guests reach details faster and have explicit playback control, but the interaction is busier and loses the envelope moment after the first visit.

## Verification

Add or update focused tests to confirm:

- Pressing Enter always reveals the envelope, even when an old envelope storage key exists.
- Opening the envelope reveals details without writing envelope state to `localStorage`.
- Pressing Enter attempts to start ambient music.
- The compact mute control appears only while music is active, stops playback, and does not restart during that visit.
- Audio initialization failure leaves the envelope and details usable.
- Modern theme renders no quick-navigation landmark or shortcut links.
- Modern timeline renders all events in chronological order with vertical-stepper classes and no horizontal-scroll styling.
- Legacy themes retain their current timeline presentation.
- Focus still moves to the envelope after Enter and to the detail heading after opening.

Run the full Vitest suite, ESLint, and the Next.js production build. Visually verify the vertical stepper and mute control at mobile and desktop widths, including that neither covers important content.

## Out of Scope

- Replacing the generated ambient melody with a recorded music file
- Persisting mute or volume preferences
- Adding volume levels, fade controls, or a replay button
- Reordering event data or changing event copy
- Changing the landing portrait, gallery, RSVP, venue, or check-in behavior
