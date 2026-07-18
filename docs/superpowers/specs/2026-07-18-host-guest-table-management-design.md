# Host Guest Creation and Drag-and-Drop Table Planning Design

## Goal

Allow a signed-in host to create one invitation without preparing a CSV file and to assign accepted, currently unseated invitations to tables by dragging them from an unassigned guest pool.

## Scope

This change adds two connected host workflows:

1. Create one invitation from the guest-list tab.
2. Drag an accepted, unseated invitation onto a table to assign the whole responding party.

CSV import, invitation editing, link rotation, split-table assignment, table reveal controls, and CSV export remain available.

## Manual Guest Creation

The guest-list toolbar gains a `+ เพิ่มแขก` button next to `Import CSV`. Activating it opens a focused modal with these fields:

- `ชื่อบนคำเชิญ` — required, 1–160 trimmed characters.
- `ชื่อผู้ติดต่อ` — required, 1–160 trimmed characters.
- `โทรศัพท์` — optional, at most 40 trimmed characters.
- `อีเมล` — optional, but valid when present.
- `โน้ต host` — optional, at most 500 trimmed characters.

Submitting the form uses the same invitation preparation service as CSV import so the new invitation receives a unique six-character invite code and opaque token. The invitation begins in `pending` status with the repository's existing RSVP defaults.

The API rejects the request when either a normalized phone number or a case-insensitive email already belongs to an existing invitation. Validation and duplicate errors remain visible in the modal so the host can correct the entry without re-entering all fields.

After a successful creation, the modal closes, the dashboard reloads, and the new invitation appears in the existing one-time link panel. The host can copy its link or download it using the existing invitation-link export. The server records a `guest_create` audit event rather than the CSV-specific `guest_import` event.

The existing CSV request and response remain compatible. The guest endpoint accepts either the current `{ csv }` body or a new `{ guest }` body and routes both through shared duplicate detection and invitation preparation behavior.

## Unassigned Guest Pool

The table-planning tab gains a clearly labelled `แขกที่ยังไม่มีโต๊ะ` pool above the table grid. It contains invitations that meet both conditions:

- RSVP status is `accepted`.
- No table assignment currently exists for the invitation.

Pending, maybe, and rejected invitations are not shown. Partially assigned invitations are also excluded because the drag interaction represents placing the whole party. Existing numeric/select controls remain the path for deliberate split-table assignment.

Each guest card displays the invitation display name and the responding party size, calculated as `adultCount + childCount`. The empty pool shows a short completion message instead of a blank area.

## Drag-and-Drop Interaction

The implementation uses `@dnd-kit/core` with pointer, touch, and keyboard sensors. Each unassigned guest card is draggable, and each table card is a drop target.

While dragging:

- The source card retains enough visual context to show where it came from.
- The dragged invitation appears in a drag overlay.
- The table under the pointer or keyboard focus receives a visible highlight.
- Accessible announcements identify the invitation and target table.

Dropping a guest on a table submits the existing `assign` action with `seatCount` equal to the full responding party size. The server remains authoritative and applies its existing assignment validation. A successful response reloads the dashboard, removes the guest from the unassigned pool, and displays the assignment on the table card.

If a table lacks capacity or the request fails, the guest stays in the pool and the host sees the server error in the dashboard notice. While an assignment request is pending, the affected interaction is disabled to prevent duplicate submissions.

The existing select and numeric assignment controls remain available as a fallback and for split-table seating. Removing the invitation's last assignment returns it to the unassigned pool automatically after the dashboard reloads.

## Component Boundaries

The current host dashboard remains responsible for loading shared host state and selecting tabs. Focused components keep the new behavior testable and prevent further growth of the dashboard file:

- `GuestCreateModal` owns form state, client-side submission state, field-level/server error display, and successful-link handoff.
- `TablePlanner` derives the unassigned pool from invitations and assignment summaries, configures drag sensors, and maps a completed drop to the existing table-assignment callback.
- Small draggable guest and droppable table-card units live with `TablePlanner` unless extraction is needed for readable tests.
- A domain helper identifies accepted invitations with no assignments and computes the full party size without coupling tests to rendered markup.

The API and repository interfaces do not need a new persistence method because `createInvitations` already accepts one or more prepared records.

## Data Flow

### Create one guest

1. The host opens the modal and submits guest details.
2. `POST /api/host/guests` validates the `{ guest }` body and checks duplicates.
3. The existing invitation preparation service creates one token, token hash, and invite code.
4. The repository inserts the invitation and the API records `guest_create`.
5. The response returns the one-time link payload.
6. The dashboard reloads data and adds the link to its existing copy/download panel.

### Drag to a table

1. `TablePlanner` derives accepted invitations with no assignment.
2. The host drags one invitation card onto a table.
3. The planner calls the existing assignment callback with the invitation ID, table ID, and full responding party size.
4. `POST /api/host/tables` validates the request and persists it transactionally through the repository.
5. The dashboard reload updates the pool, table occupancy, and invitation seating summary.

## Error Handling

- Required and format validation errors stay in the creation modal.
- Duplicate phone/email errors use the same normalization rules for manual creation and CSV import.
- Unexpected creation failures keep the form values intact and expose a useful Thai error.
- Invalid or capacity-exceeding drops preserve the unassigned card and show the existing server message.
- Network failures produce a Thai fallback message rather than leaving the UI in a busy state.
- A drag ending outside a table makes no request and leaves state unchanged.

## Responsive and Accessible Behavior

Guest creation uses the existing host modal pattern and remains usable within the current mobile breakpoint. The unassigned pool wraps cards on wide screens and becomes a horizontally scrollable or compact stacked region on narrow screens without shrinking touch targets below a comfortable size.

Draggable cards remain operable with keyboard controls supplied by `dnd-kit`. Visible focus, drag, valid-target, busy, and error states do not rely on color alone. The existing non-drag table controls remain available for hosts who prefer form controls.

## Testing

Automated coverage will include:

- Domain tests for filtering accepted invitations with no assignments and computing party size.
- Guest API tests for successful single creation, one-time link response, duplicate rejection, validation failure, audit action, and preservation of CSV import behavior.
- `GuestCreateModal` tests for required fields, submitted payload, retained values on failure, and success callback.
- `TablePlanner` tests for pool membership, full-party seat count on drop, no request outside a table, server-error preservation, and return to the pool after the final assignment is removed.
- Existing table-domain, guest-import, and host workflows as regression coverage.
- Type checking, linting, the full test suite, and a production build before completion.

## Non-Goals

- Creating several guests through a multi-row web form.
- Dragging pending, maybe, or rejected invitations onto tables.
- Choosing a partial seat count during a drag.
- Dragging an assignment from one table directly to another.
- Reordering guests within a table.
- Changing database schema or invitation-token storage rules.
