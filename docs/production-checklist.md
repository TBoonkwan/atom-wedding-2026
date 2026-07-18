# Production checklist

## Before staging

- Run the Supabase migration and configure all Vercel environment variables.
- Protect preview routes with `PREVIEW_PASSWORD`.
- Add the preview callback URL to the Supabase Auth redirect allowlist.
- Verify the host allowlist and complete one host magic-link sign-in.
- Import only mock guests first; securely save the one-time invitation-link export.

## Acceptance checks

- Test Accept, Maybe, Reject, edits, the 27 November soft-deadline marker, and the 4 December 14:59 edit cutoff in Asia/Bangkok.
- Confirm adult, child, child-seat, allergy, accessibility, beer, and song values on the dashboard/export.
- Open Google Calendar and the ICS file on Apple Calendar and Outlook; confirm 15:00–22:00.
- Test all 30 tables, split assignments, capacity warnings, and the reveal toggle.
- Open self check-in, scan twice, adjust the arrived count from the host flow, and verify the realtime totals.
- Test Safari and Chrome on a narrow mobile viewport, keyboard navigation, reduced motion, slow images, and sound opt-in.
- Verify that an invalid invitation token cannot read RSVP data or the payment QR.

## Launch

- Select one visual theme for `/i/[token]`.
- Confirm the venue address and Google Maps destination with Celebce Venue.
- Confirm photography/publication permissions and the payment QR account holder.
- Back up the guest list and invitation-link export before importing real guests.
- Connect the custom domain, update `NEXT_PUBLIC_SITE_URL`, and add its auth callback URL.
- Review Supabase logs, RLS policies, rate limits, and database backups.
- Keep third-party analytics disabled on tokenized invitation URLs.
