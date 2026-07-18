# Check-in Table Reveal and Admin RSVP Reason Design

## Goal

Make the guest's assigned table immediately visible after a successful self check-in while preserving the host-controlled table reveal on the invitation page. Also make RSVP reasons optional and surface them directly in the Admin guest table.

## Scope

This change covers two related guest-arrival and host-visibility improvements:

1. A successfully checked-in guest sees every table currently assigned to their invitation, even when those tables have not been publicly revealed by the host.
2. The Admin guest list includes an RSVP reason column. Reasons are optional for `maybe` and `rejected` responses; accepted and pending invitations do not provide a reason.

No database migration is required because invitations and RSVP history already store the `reason` field, and table assignments already identify every table assigned to an invitation.

## Check-in Table Visibility

The existing public invitation behavior remains unchanged. Before check-in, table numbers appear on the invitation page only when the host has marked the relevant tables as revealed.

After self check-in succeeds, the check-in service resolves the invitation's current table assignments independently of the public reveal flag. The success response includes all assigned table numbers in ascending order with duplicates removed.

The success screen displays:

- `โต๊ะ 2` for one assigned table.
- `โต๊ะ 2, 3` for multiple assigned tables.
- `ทีมงานจะแจ้งโต๊ะให้ทราบอีกครั้ง` when the invitation has no table assignment.

Table information is returned only after the existing event-code, invitation-code, RSVP-status, attendee-count, and check-in validations succeed. A failed check-in does not expose an unrevealed assignment.

## Admin RSVP Reason Column

The Admin guest-list table gains a `เหตุผล` column. It uses the invitation's current `reason` value:

- `maybe` and `rejected`: show the trimmed reason when one was provided.
- `maybe` and `rejected`: show `—` when the optional reason is empty.
- `accepted` and `pending`: show `—`.

Long reasons wrap within a width-constrained cell so the row remains readable. The existing horizontal table scrolling remains available on narrow screens.

Clicking a guest row and the existing RSVP history behavior remain unchanged. This scope does not add duplicate reason content to the edit modal.

## Optional RSVP Reason

The RSVP form continues to show the reason textarea only for `maybe` and `rejected` responses, but it is no longer required. Guests may submit either status with an empty reason.

The accepted response continues to have no reason field. When an invitation changes from `maybe` or `rejected` to `accepted`, the submitted accepted response clears the obsolete reason so the current invitation does not retain an explanation for an earlier status. Historical RSVP snapshots remain unchanged and continue to preserve what was submitted at each point in time.

Client-side and domain validation use the same optional rule. The server still trims the value and enforces the existing 500-character maximum.

## Component and Service Boundaries

- `selfCheckIn` remains responsible for validating and recording a guest self check-in. After the write succeeds, it derives the assigned table numbers from the repository's existing table and assignment reads.
- The check-in API continues to expose the service result without moving table-assignment logic into the route handler.
- `CheckInForm` keeps its current success and fallback rendering behavior.
- `RsvpForm` owns conditional reason-field visibility and clears stale reasons when the guest selects `accepted`.
- `validateRsvp` remains the authoritative server-side validation rule and accepts an empty reason for every status.
- `HostDashboard` renders the new reason column from the invitation data already returned by the overview API.

No repository interface, database schema, or public invitation response shape needs to change.

## Data Flow

### Self check-in

1. The guest submits the venue event code, invitation code, and arriving party size.
2. `selfCheckIn` performs the existing validation and records the check-in.
3. After the write succeeds, the service reads tables and assignments, selects assignments for that invitation, and maps them to table numbers without applying the public `revealed` filter.
4. The API returns the checked-in guest details and assigned table numbers.
5. The success screen shows the table numbers or the unassigned fallback message.

### RSVP reason

1. A guest chooses `maybe` or `rejected` and may leave the reason empty.
2. Client and server validation accept the empty value and preserve the maximum length rule.
3. The repository stores the current RSVP and its history snapshot through the existing transaction.
4. The Admin overview returns the invitation's current reason through the existing invitation payload.
5. The guest-list table renders the reason or `—` according to status and content.

## Error Handling and Privacy

- Existing check-in validation and rate limits remain unchanged.
- Unrevealed table assignments are disclosed only in the response to a successful check-in for that invitation.
- If table or assignment retrieval fails after the check-in write, the request returns the existing server error path rather than claiming the guest has no assignment.
- Empty optional reasons are stored and displayed consistently as no reason.
- Reason text is rendered as React text content; no HTML interpretation is introduced.

## Testing

Automated coverage will include:

- Check-in service tests proving an assigned but unrevealed table is returned after successful check-in.
- Check-in service tests for multiple assigned tables, stable ascending order, duplicate removal, and no assignment.
- Check-in form tests for assigned-table display and the existing unassigned fallback.
- RSVP domain tests proving `maybe` and `rejected` accept an empty reason while retaining the 500-character limit.
- RSVP form tests proving the reason field is optional for `maybe` and `rejected`, absent for `accepted`, and cleared when switching to `accepted`.
- Host dashboard tests proving the reason column displays current `maybe` and `rejected` reasons and uses `—` for empty, accepted, and pending rows.
- Existing public invitation tests as regression coverage for host-controlled table reveal behavior.
- Type checking, linting, the full test suite, and a production build before completion.

## Non-Goals

- Removing the host's table reveal control from the invitation experience.
- Showing unrevealed table assignments before successful check-in.
- Adding a reason field to accepted RSVPs.
- Showing RSVP-history reasons in the guest edit modal.
- Adding filters or search behavior for RSVP reasons.
- Changing table assignments or reveal state as a side effect of check-in.
