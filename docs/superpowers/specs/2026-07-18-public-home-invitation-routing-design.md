# Public Home and Invitation Routing Design

## Objective

Turn the selected Modern Xi wedding experience into the production home page while keeping RSVP private to each guest invitation. Remove the old demo and preview URLs from the public product.

## Routes

- `/` renders the public wedding experience: black-and-white entry image, envelope interaction, event details, timeline, venue, wedding colors, gallery, countdown, and ambient music.
- `/` does not render RSVP controls, accepted-state calendar actions, invitation-specific table data, or invitation-specific browser storage.
- `/invitation/[token]` renders the personalized wedding experience and retains the existing RSVP behavior.
- `/invitation/[token]#rsvp` is the canonical direct link to the RSVP section. A separate `/invitation/[token]/rsvp` page is not required.
- `/invitation` redirects to `/` because it has no guest token.
- `/i/*`, `/preview/*`, and the former `/i/demo-np-2026` URL return `404` permanently.
- Host and check-in routes remain unchanged.

## Component Design

`InvitationExperience` remains the shared visual implementation and receives an explicit experience mode:

- `public`: uses non-personalized copy, never stores an invite code, removes RSVP navigation and content, and does not require calendar URLs.
- `personalized`: uses the invitation name and status, stores the invite code for returning check-in, and renders RSVP and accepted-state calendar actions.

The public page receives a presentation-only guest shape rather than reading an invitation record from Supabase. This prevents anonymous visitors from sharing or overwriting one RSVP response.

## Invitation Link Migration

All newly generated invitation links use `/invitation/[token]`. Existing `/i/[token]` links are intentionally not redirected because the approved requirement is to retire that route family permanently. The host dashboard, QR generation, CSV/exported links, calendar URLs, and tests must use the new canonical route.

The obsolete `demo-np-2026` invitation record is removed from the production database after the local implementation has been approved. Local demo repository fixtures remain available only for automated tests and offline development; they are not exposed by production routes.

## Error and Privacy Behavior

- Missing or invalid invitation tokens return the existing not-found response.
- Public visitors cannot submit RSVP through `/` or derive a shared invitation token from its markup.
- Invitation tokens remain in a path segment instead of a query string.
- No third-party analytics are introduced on invitation URLs.

## Test Strategy

- Prove `/` renders the Modern Xi public experience without RSVP, personalized greeting, table data, calendar actions, or invite-code storage.
- Prove `/invitation/[token]` retains personalized RSVP behavior and calendar actions only after acceptance.
- Prove generated invitation links use `/invitation/[token]`.
- Prove `/invitation` redirects to `/`.
- Prove `/i/*` and `/preview/*` return `404`.
- Run focused tests first, then the full unit suite, lint, and production build.
- Verify the local site in a mobile-sized browser at `/` and with a valid local invitation token before requesting deployment approval.

## Delivery Boundary

Implementation, database cleanup, push, and Vercel deployment are separate checkpoints. This change is implemented and demonstrated locally first. No production database mutation, GitHub push, or Vercel deployment occurs until the user approves the local result.
