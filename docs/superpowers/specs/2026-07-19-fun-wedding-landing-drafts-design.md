# Fun Wedding Landing Drafts Design

## Goal

Add three high-fidelity, clickable landing-page drafts for Nathapol and Pennisut so the approved creative directions can be compared in the real Next.js application without replacing the current production invitation.

## Approved directions

### 1. Neon Editorial Party

- Near-black and dark-chocolate base with cream, electric coral, hot pink, and acid-lime accents.
- Oversized compressed typography, asymmetric magazine-cover composition, outlined date, ticker fragments, and a circular high-energy CTA.
- The real black-and-white ring photograph remains the visual anchor.

### 2. Pop Postcard Collage

- Butter-paper base with cherry red, blush, cobalt, and teal accents.
- Chunky friendly typography, rotated postcard layers, CSS tape and stamps, playful offset shadows, and a prominent pill CTA.
- The layout is joyful and premium rather than childlike.

### 3. Afterdark Ticket Club

- Midnight ink, navy, burgundy, hot red, silver, and warm-white palette.
- Cinematic photograph treatment combined with an admission-ticket grid, numbered event details, chrome-style title, barcode motif, and a bold Chinese double-happiness stamp.
- The tone is edgy and premium without becoming visually gloomy.

## Architecture

The work adds a focused `src/components/drafts` surface independent from the existing invitation experience. A single shared `WeddingLandingDraft` component receives a strict theme identifier and renders theme-specific markup where composition genuinely differs, while shared wedding facts, navigation, accessibility labels, and image source remain centralized.

Four static routes expose the drafts:

- `/drafts` is the comparison index.
- `/drafts/neon-editorial` renders direction 1.
- `/drafts/pop-postcard` renders direction 2.
- `/drafts/afterdark-ticket` renders direction 3.

Static route folders are preferred over a dynamic route because there are exactly three approved options, the routes remain explicit, and the synchronous page components stay straightforward to unit test with the project’s current Vitest setup.

## Components and responsibilities

### `draft-data.ts`

Defines the `DraftTheme` union, immutable shared wedding facts, theme metadata, route paths, labels, and preview descriptions. It provides a `DRAFTS` list used by both the index and draft navigation.

### `draft-index.tsx`

Renders the comparison landing page with three art-directed cards. Each card includes the direction name, concise positioning copy, palette chips, and a direct link to its full draft.

### `wedding-landing-draft.tsx`

Renders the full first-viewport experience and supporting event strip. It owns shared semantic structure and delegates theme-specific visual composition to small internal sections rather than introducing unnecessary runtime state.

### `drafts.css`

Contains only draft-specific tokens, layouts, responsive rules, focus states, and reduced-motion overrides. All selectors are scoped under `.landing-drafts` or `.landing-draft` so the existing invitation, host, and check-in interfaces are unaffected.

## Interaction and data flow

All content is local and read-only. The route page selects one theme and passes it to `WeddingLandingDraft`; the component reads the matching metadata from `draft-data.ts` and renders the correct hero.

Each draft includes:

- A visible link back to `/drafts`.
- A compact switcher linking to all three drafts.
- A primary “ENTER OUR WEDDING” anchor that moves to the on-page event details strip.
- The shared date `04.12.2026`, Friday at `15:00`, `Celebce Venue`, and programme copy `Tea ceremony · Dinner · After party`.

No client-side storage, API call, form submission, or invitation state is added.

## Responsive and accessibility requirements

- The compositions must remain legible from 320 px wide through large desktop viewports.
- The real wedding photograph uses `next/image` with accurate alternative text, explicit responsive `sizes`, and eager loading for the first viewport without the deprecated Next.js 16 `priority` prop.
- Headings retain a logical order, decorative text is hidden from assistive technology where appropriate, and all interactive elements are native links.
- Every link has a visible keyboard focus treatment with sufficient contrast.
- Motion is decorative and subtle. All animation and transition effects are disabled under `prefers-reduced-motion: reduce`.

## Error handling

There is no runtime data or user input. Static routes eliminate invalid theme parameters. Missing image or build-time type errors are handled by the normal Next.js build and automated verification pipeline rather than custom runtime UI.

## Testing

Component tests will verify:

- The index exposes exactly the three approved full-draft links.
- Each theme renders its unique direction label and the shared wedding information.
- The draft switcher links to all three routes and the primary CTA targets the details section.
- Decorative theme differences do not remove accessible names or landmark structure.

Verification includes the focused component tests, the complete Vitest suite, ESLint, and a production Next.js build.

## Scope boundaries

- The existing `/` public invitation and personalized invitation routes remain unchanged.
- RSVP, envelope, music, gallery, check-in, host, Supabase, and API behavior are unchanged.
- The drafts remain local application routes; publishing or selecting one as the production theme is a separate decision.
