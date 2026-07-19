# Fun Wedding Landing Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three responsive, clickable wedding landing-page drafts plus a comparison index without changing the production invitation.

**Architecture:** A typed draft catalog centralizes routes and copy. Synchronous React components render a shared index and a theme-specific landing experience, while four explicit App Router pages expose the approved routes. A dedicated scoped stylesheet keeps the experimental visual system isolated from the existing invitation UI.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `next/link`, `next/image`, Vitest, React Testing Library, CSS.

## Global Constraints

- Keep `/`, personalized invitations, RSVP, envelope, music, gallery, check-in, host, Supabase, and API behavior unchanged.
- Expose exactly `/drafts`, `/drafts/neon-editorial`, `/drafts/pop-postcard`, and `/drafts/afterdark-ticket`.
- Use the real `/gallery/photo-08.jpg` wedding photograph and the shared content `NATHAPOL & PENNISUT`, `04.12.2026`, `FRIDAY · 15:00`, `CELEBCE VENUE`, and `Tea ceremony · Dinner · After party`.
- Use responsive layouts down to 320 px, native links, visible focus states, semantic headings, and reduced-motion overrides.
- Do not add dependencies, runtime data, storage, forms, or API calls.

---

### Task 1: Typed draft catalog

**Files:**
- Create: `src/components/drafts/draft-data.ts`
- Create: `src/components/drafts/draft-data.test.ts`

**Interfaces:**
- Produces: `DraftTheme`, `DraftOption`, `DRAFTS`, `WEDDING_DRAFT_FACTS`, and `getDraft(theme)`.
- Consumes: no application modules.

- [ ] **Step 1: Write the failing catalog test**

```ts
import { describe, expect, it } from 'vitest';
import { DRAFTS, getDraft } from './draft-data';

describe('draft catalog', () => {
  it('exposes the three approved routes in comparison order', () => {
    expect(DRAFTS.map((draft) => draft.href)).toEqual([
      '/drafts/neon-editorial',
      '/drafts/pop-postcard',
      '/drafts/afterdark-ticket',
    ]);
  });

  it('resolves an approved draft by theme', () => {
    expect(getDraft('afterdark-ticket').title).toBe('Afterdark Ticket Club');
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/components/drafts/draft-data.test.ts`

Expected: FAIL because `./draft-data` does not exist.

- [ ] **Step 3: Add the minimal typed catalog**

```ts
export type DraftTheme = 'neon-editorial' | 'pop-postcard' | 'afterdark-ticket';

export type DraftOption = {
  id: DraftTheme;
  number: string;
  title: string;
  strapline: string;
  description: string;
  href: `/drafts/${DraftTheme}`;
  palette: readonly string[];
};

export const WEDDING_DRAFT_FACTS = {
  names: 'NATHAPOL & PENNISUT',
  date: '04.12.2026',
  time: 'FRIDAY · 15:00',
  venue: 'CELEBCE VENUE',
  programme: 'Tea ceremony · Dinner · After party',
} as const;

export const DRAFTS: readonly DraftOption[] = [
  {
    id: 'neon-editorial', number: '01', title: 'Neon Editorial Party',
    strapline: 'Fashion campaign meets Bangkok after-party',
    description: 'Electric, oversized, energetic.',
    href: '/drafts/neon-editorial',
    palette: ['#120b0b', '#ff4b4b', '#ff2f88', '#d9ff43'],
  },
  {
    id: 'pop-postcard', number: '02', title: 'Pop Postcard Collage',
    strapline: 'A joyful love note with a graphic-design pulse',
    description: 'Warm, playful, art-directed.',
    href: '/drafts/pop-postcard',
    palette: ['#fff8e8', '#e53a31', '#f3a7b3', '#1545c7'],
  },
  {
    id: 'afterdark-ticket', number: '03', title: 'Afterdark Ticket Club',
    strapline: 'One ceremony. One admission. One big night.',
    description: 'Cinematic, premium, club-ready.',
    href: '/drafts/afterdark-ticket',
    palette: ['#050710', '#4b0b1b', '#f33b3f', '#dce0e8'],
  },
] as const;

export function getDraft(theme: DraftTheme) {
  return DRAFTS.find((draft) => draft.id === theme)!;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/components/drafts/draft-data.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the catalog**

```bash
git add src/components/drafts/draft-data.ts src/components/drafts/draft-data.test.ts
git commit -m "feat: add wedding draft catalog"
```

### Task 2: Comparison index

**Files:**
- Create: `src/components/drafts/draft-index.tsx`
- Create: `src/components/drafts/draft-index.test.tsx`
- Create: `src/app/drafts/page.tsx`

**Interfaces:**
- Consumes: `DRAFTS` and `WEDDING_DRAFT_FACTS` from `draft-data.ts`.
- Produces: `DraftIndex` and the `/drafts` route.

- [ ] **Step 1: Write the failing index behavior test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DraftIndex } from './draft-index';

describe('DraftIndex', () => {
  it('links to exactly the three approved full drafts', () => {
    render(<DraftIndex />);
    const links = screen.getAllByRole('link', { name: /open draft/i });
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/drafts/neon-editorial',
      '/drafts/pop-postcard',
      '/drafts/afterdark-ticket',
    ]);
  });

  it('frames the page as a three-direction comparison', () => {
    render(<DraftIndex />);
    expect(screen.getByRole('heading', { level: 1, name: /three ways to say/i }))
      .toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/components/drafts/draft-index.test.tsx`

Expected: FAIL because `DraftIndex` does not exist.

- [ ] **Step 3: Implement the semantic index and route**

```tsx
// src/components/drafts/draft-index.tsx
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DRAFTS, WEDDING_DRAFT_FACTS } from './draft-data';

export function DraftIndex() {
  return (
    <main className="landing-drafts">
      <header className="drafts-intro">
        <span className="drafts-seal" aria-hidden="true">囍</span>
        <p className="drafts-kicker">NATHAPOL × PENNISUT · 04 DEC 2026</p>
        <h1>Three ways to say<br /><em>we’re getting married.</em></h1>
        <p>Three clickable directions using the same photograph and event details.</p>
      </header>
      <section className="drafts-grid" aria-label="Wedding landing page directions">
        {DRAFTS.map((draft) => (
          <article className="draft-preview-card" data-preview={draft.id} key={draft.id}>
            <div className="draft-preview-photo">
              <Image
                src="/gallery/photo-08.jpg"
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 33vw"
              />
              <span aria-hidden="true">{draft.number}</span>
            </div>
            <div className="draft-preview-copy">
              <p>{draft.strapline}</p>
              <h2>{draft.title}</h2>
              <p>{draft.description}</p>
              <div className="draft-palette" aria-hidden="true">
                {draft.palette.map((color) => (
                  <span key={color} style={{ '--draft-swatch': color } as CSSProperties} />
                ))}
              </div>
              <Link href={draft.href} aria-label={`Open draft ${draft.number}`}>
                Open draft <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        ))}
      </section>
      <footer className="drafts-footer">
        <span>{WEDDING_DRAFT_FACTS.date}</span>
        <span>{WEDDING_DRAFT_FACTS.venue}</span>
      </footer>
    </main>
  );
}
```

```tsx
// src/app/drafts/page.tsx
import type { Metadata } from 'next';
import { DraftIndex } from '@/components/drafts/draft-index';

export const metadata: Metadata = { title: 'Wedding Landing Drafts' };

export default function DraftsPage() {
  return <DraftIndex />;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/components/drafts/draft-index.test.tsx`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the comparison index**

```bash
git add src/components/drafts/draft-index.tsx src/components/drafts/draft-index.test.tsx src/app/drafts/page.tsx
git commit -m "feat: add wedding draft comparison index"
```

### Task 3: Shared full-draft experience and routes

**Files:**
- Create: `src/components/drafts/wedding-landing-draft.tsx`
- Create: `src/components/drafts/wedding-landing-draft.test.tsx`
- Create: `src/app/drafts/neon-editorial/page.tsx`
- Create: `src/app/drafts/pop-postcard/page.tsx`
- Create: `src/app/drafts/afterdark-ticket/page.tsx`

**Interfaces:**
- Consumes: `DraftTheme`, `DRAFTS`, `getDraft`, and `WEDDING_DRAFT_FACTS`.
- Produces: `WeddingLandingDraft({ theme }: { theme: DraftTheme })` and three static full-draft routes.

- [ ] **Step 1: Write the failing full-draft tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeddingLandingDraft } from './wedding-landing-draft';

describe('WeddingLandingDraft', () => {
  it.each([
    ['neon-editorial', 'Neon Editorial Party'],
    ['pop-postcard', 'Pop Postcard Collage'],
    ['afterdark-ticket', 'Afterdark Ticket Club'],
  ] as const)('renders %s with shared wedding facts', (theme, title) => {
    render(<WeddingLandingDraft theme={theme} />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText('04.12.2026')).toBeInTheDocument();
    expect(screen.getByText('CELEBCE VENUE')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /holding their wedding rings/i }))
      .toBeInTheDocument();
  });

  it('provides draft switching and an in-page enter action', () => {
    render(<WeddingLandingDraft theme="neon-editorial" />);
    expect(screen.getAllByRole('link', { name: /view .* draft/i })).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Enter our wedding' }))
      .toHaveAttribute('href', '#draft-details');
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/components/drafts/wedding-landing-draft.test.tsx`

Expected: FAIL because `WeddingLandingDraft` does not exist.

- [ ] **Step 3: Implement shared semantics and three art-directed compositions**

```tsx
// src/components/drafts/wedding-landing-draft.tsx
import Image from 'next/image';
import Link from 'next/link';
import { DRAFTS, getDraft, WEDDING_DRAFT_FACTS, type DraftTheme } from './draft-data';

const facts = WEDDING_DRAFT_FACTS;

function WeddingPhoto({ className = '' }: { className?: string }) {
  return (
    <div className={`draft-photo ${className}`}>
      <Image
        src="/gallery/photo-08.jpg"
        alt="Nathapol and Pennisut holding their wedding rings"
        fill
        sizes="(max-width: 760px) 100vw, 62vw"
        loading="eager"
      />
    </div>
  );
}

function NeonHero() {
  return (
    <section className="draft-hero neon-hero">
      <div className="neon-title"><h1>NATHAPOL <i>&amp;</i> PENNISUT</h1></div>
      <WeddingPhoto />
      <p className="neon-issue">Wedding issue · Bangkok after dark</p>
      <strong className="neon-date">{facts.date}</strong>
      <span className="neon-sticker" aria-hidden="true">YES!<br />OFFICIAL</span>
      <a className="draft-enter neon-enter" href="#draft-details">Enter our wedding</a>
    </section>
  );
}

function PopHero() {
  return (
    <section className="draft-hero pop-hero">
      <div className="pop-copy">
        <p>One day only · made with love</p>
        <h1>NATHAPOL <i>&amp;</i><br />PENNISUT</h1>
        <div className="pop-date"><strong>{facts.date}</strong><span>{facts.time}<br />{facts.venue}</span></div>
        <a className="draft-enter pop-enter" href="#draft-details">Enter our wedding <span aria-hidden="true">→</span></a>
      </div>
      <div className="pop-collage">
        <WeddingPhoto />
        <span className="pop-stamp" aria-hidden="true">YES!</span>
        <span className="pop-note">Tea · Dinner · Dance</span>
      </div>
    </section>
  );
}

function AfterdarkHero() {
  return (
    <section className="draft-hero afterdark-hero">
      <div className="afterdark-visual">
        <WeddingPhoto />
        <p>Presents / a union after dark</p>
        <h1>NATHAPOL<br />PENNISUT</h1>
      </div>
      <div className="afterdark-ticket">
        <p>Date of admission</p>
        <strong>{facts.date}</strong>
        <span>{facts.time}</span>
        <b aria-hidden="true">囍</b>
        <dl><div><dt>Venue</dt><dd>{facts.venue}</dd></div><div><dt>Running order</dt><dd>{facts.programme}</dd></div></dl>
        <a className="draft-enter afterdark-enter" href="#draft-details">Enter our wedding <span aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}

const HEROES: Record<DraftTheme, () => React.JSX.Element> = {
  'neon-editorial': NeonHero,
  'pop-postcard': PopHero,
  'afterdark-ticket': AfterdarkHero,
};

export function WeddingLandingDraft({ theme }: { theme: DraftTheme }) {
  const draft = getDraft(theme);
  const Hero = HEROES[theme];
  return (
    <main className="landing-draft" data-draft={theme}>
      <nav className="draft-nav" aria-label="Draft navigation">
        <Link href="/drafts">All drafts</Link>
        <span className="draft-direction-title">{draft.title}</span>
        <div>{DRAFTS.map((item) => <Link key={item.id} href={item.href} aria-label={`View ${item.title} draft`} aria-current={item.id === theme ? 'page' : undefined}>{item.number}</Link>)}</div>
      </nav>
      <Hero />
      <section className="draft-detail-strip" id="draft-details" tabIndex={-1}>
        <p><span>Date</span><strong>{facts.date}</strong></p>
        <p><span>Time</span><strong>{facts.time}</strong></p>
        <p><span>Venue</span><strong>{facts.venue}</strong></p>
        <p><span>Programme</span><strong>{facts.programme}</strong></p>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add the three explicit route wrappers**

```tsx
// src/app/drafts/neon-editorial/page.tsx
import type { Metadata } from 'next';
import { WeddingLandingDraft } from '@/components/drafts/wedding-landing-draft';

export const metadata: Metadata = { title: 'Neon Editorial Party · Wedding Draft' };
export default function Page() { return <WeddingLandingDraft theme="neon-editorial" />; }
```

```tsx
// src/app/drafts/pop-postcard/page.tsx
import type { Metadata } from 'next';
import { WeddingLandingDraft } from '@/components/drafts/wedding-landing-draft';

export const metadata: Metadata = { title: 'Pop Postcard Collage · Wedding Draft' };
export default function Page() { return <WeddingLandingDraft theme="pop-postcard" />; }
```

```tsx
// src/app/drafts/afterdark-ticket/page.tsx
import type { Metadata } from 'next';
import { WeddingLandingDraft } from '@/components/drafts/wedding-landing-draft';

export const metadata: Metadata = { title: 'Afterdark Ticket Club · Wedding Draft' };
export default function Page() { return <WeddingLandingDraft theme="afterdark-ticket" />; }
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- src/components/drafts/wedding-landing-draft.test.tsx`

Expected: 4 tests pass.

- [ ] **Step 6: Commit the full draft experiences**

```bash
git add src/components/drafts/wedding-landing-draft.tsx src/components/drafts/wedding-landing-draft.test.tsx src/app/drafts/neon-editorial/page.tsx src/app/drafts/pop-postcard/page.tsx src/app/drafts/afterdark-ticket/page.tsx
git commit -m "feat: add three wedding landing drafts"
```

### Task 4: Scoped art direction and responsive polish

**Files:**
- Create: `src/components/drafts/drafts.css`
- Modify: `src/components/drafts/draft-index.tsx`
- Modify: `src/components/drafts/wedding-landing-draft.tsx`
- Modify: `src/components/drafts/draft-index.test.tsx`
- Modify: `src/components/drafts/wedding-landing-draft.test.tsx`

**Interfaces:**
- Consumes: semantic class hooks from Tasks 2 and 3.
- Produces: isolated desktop/mobile art direction and reduced-motion behavior.

- [ ] **Step 1: Add failing style-contract assertions**

Add these imports and test to `wedding-landing-draft.test.tsx`:

```tsx
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const draftStylesPath = resolve(process.cwd(), 'src/components/drafts/drafts.css');
const draftStyles = existsSync(draftStylesPath) ? readFileSync(draftStylesPath, 'utf8') : '';

it('ships scoped responsive styles and reduced-motion support', () => {
  expect(draftStyles).toContain('[data-draft="neon-editorial"]');
  expect(draftStyles).toContain('[data-draft="pop-postcard"]');
  expect(draftStyles).toContain('[data-draft="afterdark-ticket"]');
  expect(draftStyles).toContain('@media (max-width: 720px)');
  expect(draftStyles).toContain('@media (prefers-reduced-motion: reduce)');
  expect(draftStyles).toContain(':focus-visible');
});
```

- [ ] **Step 2: Run the component tests and verify RED**

Run: `npm test -- src/components/drafts/draft-index.test.tsx src/components/drafts/wedding-landing-draft.test.tsx`

Expected: FAIL because `drafts.css` does not exist.

- [ ] **Step 3: Implement the scoped stylesheet**

Add `import './drafts.css';` to both draft component files and create:

```css
/* src/components/drafts/drafts.css */
.landing-drafts {
  --paper: #fff8e8;
  --ink: #171512;
  min-height: 100svh;
  padding: clamp(28px, 5vw, 76px);
  color: var(--ink);
  background: var(--paper);
  font-family: Arial, sans-serif;
}
.drafts-intro { position: relative; max-width: 1300px; margin: auto; padding-bottom: 44px; border-bottom: 2px solid; }
.drafts-kicker { letter-spacing: .18em; text-transform: uppercase; font-size: 12px; }
.drafts-seal { position: absolute; right: 0; top: 0; display: grid; place-items: center; width: 70px; aspect-ratio: 1; color: var(--paper); background: #e53a31; font: 34px Georgia, serif; transform: rotate(5deg); }
.drafts-intro h1 { max-width: 1050px; margin: 52px 0 22px; font: 900 clamp(54px, 8.5vw, 130px)/.82 Arial Black, Arial, sans-serif; letter-spacing: -.075em; text-transform: uppercase; }
.drafts-intro h1 em { color: #e53a31; font-family: Georgia, serif; font-weight: 400; text-transform: none; }
.drafts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; max-width: 1300px; margin: 28px auto 0; }
.draft-preview-card { min-width: 0; overflow: hidden; border: 2px solid var(--ink); background: #fff; box-shadow: 8px 8px 0 var(--ink); }
.draft-preview-photo { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-bottom: 2px solid var(--ink); }
.draft-preview-photo img { object-fit: cover; filter: grayscale(1) contrast(1.14); }
.draft-preview-photo > span { position: absolute; left: 16px; bottom: 10px; color: #fff; font: 900 64px/.8 Arial Black, sans-serif; }
.draft-preview-copy { padding: 22px; }
.draft-preview-copy > p:first-child { min-height: 34px; font-size: 11px; letter-spacing: .13em; text-transform: uppercase; }
.draft-preview-copy h2 { min-height: 72px; margin: 18px 0 8px; font: 800 32px/.95 Arial, sans-serif; }
.draft-palette { display: flex; margin: 22px 0; }
.draft-palette span { flex: 1; height: 12px; background: var(--draft-swatch); }
.draft-preview-copy a { display: flex; justify-content: space-between; padding-top: 16px; border-top: 2px solid; font-weight: 800; text-decoration: none; text-transform: uppercase; }
.draft-preview-card[data-preview="neon-editorial"] { color: #fff4e8; background: #120b0b; }
.draft-preview-card[data-preview="neon-editorial"] .draft-preview-photo > span { color: #ff2f88; }
.draft-preview-card[data-preview="pop-postcard"] { background: #f3a7b3; }
.draft-preview-card[data-preview="afterdark-ticket"] { color: #dce0e8; background: #050710; }
.drafts-footer { display: flex; justify-content: space-between; max-width: 1300px; margin: 60px auto 0; padding-top: 18px; border-top: 2px solid; font-size: 12px; letter-spacing: .14em; }

.landing-draft { --bg: #120b0b; --fg: #fff4e8; --hot: #ff4b4b; min-height: 100svh; color: var(--fg); background: var(--bg); font-family: Arial, sans-serif; overflow: hidden; }
.draft-nav { position: relative; z-index: 10; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; min-height: 64px; padding: 12px 24px; border-bottom: 1px solid color-mix(in srgb, var(--fg) 30%, transparent); font-size: 11px; letter-spacing: .13em; text-transform: uppercase; }
.draft-nav a { color: inherit; text-decoration: none; }
.draft-nav > div { display: flex; justify-content: flex-end; gap: 8px; }
.draft-nav > div a { display: grid; place-items: center; width: 34px; aspect-ratio: 1; border: 1px solid; border-radius: 50%; }
.draft-nav a[aria-current="page"] { color: var(--bg); background: var(--fg); }
.draft-hero { min-height: calc(100svh - 64px); position: relative; }
.draft-photo { position: relative; overflow: hidden; }
.draft-photo img { object-fit: cover; }
.draft-enter { display: inline-flex; align-items: center; justify-content: center; min-height: 58px; padding: 16px 24px; color: inherit; border: 2px solid; font-weight: 900; letter-spacing: .05em; text-decoration: none; text-transform: uppercase; transition: transform .2s ease, color .2s ease, background .2s ease; }
.landing-draft a:focus-visible { outline: 4px solid var(--hot); outline-offset: 4px; }
.draft-enter:hover { transform: translateY(-4px) rotate(-1deg); }
.draft-detail-strip { display: grid; grid-template-columns: repeat(4, 1fr); scroll-margin-top: 20px; border-top: 1px solid color-mix(in srgb, var(--fg) 30%, transparent); }
.draft-detail-strip p { min-width: 0; margin: 0; padding: 28px; border-right: 1px solid color-mix(in srgb, var(--fg) 30%, transparent); }
.draft-detail-strip span { display: block; margin-bottom: 9px; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; opacity: .7; }
.draft-detail-strip strong { font-size: clamp(15px, 1.5vw, 22px); }

[data-draft="neon-editorial"] { --bg: #120b0b; --fg: #fff4e8; --hot: #ff2f88; }
.neon-hero { display: grid; grid-template-columns: minmax(360px, .72fr) 1.28fr; }
.neon-hero .draft-photo { grid-column: 2; min-height: calc(100svh - 64px); border-left: 1px solid #ff2f88; }
.neon-hero .draft-photo img { filter: grayscale(1) contrast(1.22); }
.neon-title { position: absolute; z-index: 2; top: 7%; left: 3%; width: min(53vw, 830px); }
.neon-title h1 { margin: 0; font: 900 clamp(72px, 10vw, 166px)/.7 Impact, Arial Narrow, sans-serif; letter-spacing: -.045em; text-transform: uppercase; }
.neon-title i { display: block; color: #ff4b4b; font-family: Georgia, serif; }
.neon-title i + br { display: none; }
.neon-issue { position: absolute; right: 18px; top: 50%; margin: 0; writing-mode: vertical-rl; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; }
.neon-date { position: absolute; z-index: 2; left: 3%; bottom: 8%; color: transparent; -webkit-text-stroke: 2px #fff4e8; font: 900 clamp(58px, 8vw, 130px)/1 Impact, sans-serif; }
.neon-sticker { position: absolute; z-index: 3; right: 38%; bottom: 18%; display: grid; place-items: center; width: 110px; aspect-ratio: 1; color: #120b0b; background: #d9ff43; clip-path: polygon(50% 0,61% 24%,82% 8%,78% 34%,100% 35%,80% 51%,96% 70%,70% 70%,69% 98%,51% 79%,33% 100%,32% 73%,5% 80%,24% 58%,0 45%,28% 38%,14% 14%,40% 25%); text-align: center; font-weight: 900; }
.neon-enter { position: absolute; z-index: 4; right: 4%; bottom: 6%; width: 178px; aspect-ratio: 1; border: 0; border-radius: 50%; color: #120b0b; background: #ff4b4b; text-align: center; }

[data-draft="pop-postcard"] { --bg: #fff8e8; --fg: #171512; --hot: #1545c7; }
.pop-hero { display: grid; grid-template-columns: 1.05fr .95fr; padding: clamp(28px, 5vw, 72px); background-image: linear-gradient(#f5dd72 1px, transparent 1px), linear-gradient(90deg, #f5dd72 1px, transparent 1px); background-size: 28px 28px; }
.pop-copy { align-self: center; position: relative; z-index: 2; }
.pop-copy > p { letter-spacing: .14em; text-transform: uppercase; font-weight: 800; }
.pop-copy h1 { margin: 28px 0; font: 900 clamp(70px, 9vw, 144px)/.78 Arial Black, Arial, sans-serif; letter-spacing: -.075em; }
.pop-copy h1 i { color: #e53a31; font-family: Georgia, serif; }
.pop-date { display: grid; grid-template-columns: auto 1fr; max-width: 680px; border: 3px solid; box-shadow: 9px 9px 0 #171512; transform: rotate(-1deg); }
.pop-date strong { padding: 18px; color: #fff8e8; background: #e53a31; font-size: 24px; }
.pop-date span { padding: 18px 26px; background: #f3a7b3; font-weight: 800; }
.pop-enter { margin-top: 42px; min-width: min(100%, 460px); border-radius: 99px; color: #fff8e8; background: #e53a31; box-shadow: 9px 9px 0 #171512; }
.pop-collage { position: relative; min-height: 640px; }
.pop-collage .draft-photo { position: absolute; inset: 6% 4% 8% 10%; border: 12px solid #fff; box-shadow: 16px 16px 0 #1545c7; transform: rotate(4deg); }
.pop-collage .draft-photo::before { content: ''; position: absolute; z-index: 2; top: -22px; left: 35%; width: 150px; height: 42px; background: #f5dd72cc; transform: rotate(-7deg); }
.pop-stamp { position: absolute; z-index: 3; right: -1%; top: 0; display: grid; place-items: center; width: 130px; aspect-ratio: 1; color: #fff; background: #1545c7; border: 8px double #fff8e8; border-radius: 50%; font: italic 900 34px Georgia, serif; transform: rotate(12deg); }
.pop-note { position: absolute; z-index: 3; left: -2%; bottom: 4%; padding: 18px 26px; background: #f3a7b3; border: 3px solid; box-shadow: 8px 8px 0; font-weight: 900; transform: rotate(-5deg); }

[data-draft="afterdark-ticket"] { --bg: #050710; --fg: #f0eee8; --hot: #f33b3f; }
.afterdark-hero { display: grid; grid-template-columns: 1.4fr .8fr; }
.afterdark-visual { position: relative; min-height: calc(100svh - 64px); overflow: hidden; }
.afterdark-visual .draft-photo { position: absolute; inset: 0; }
.afterdark-visual .draft-photo img { filter: grayscale(1) contrast(1.18) brightness(.72); }
.afterdark-visual::after { content: ''; position: absolute; inset: 0; background: linear-gradient(transparent 35%, #050710 96%); }
.afterdark-visual > p, .afterdark-visual > h1 { position: absolute; z-index: 2; left: 4%; }
.afterdark-visual > p { bottom: 20%; letter-spacing: .2em; text-transform: uppercase; }
.afterdark-visual > h1 { bottom: 2%; margin: 0; background: linear-gradient(#fff, #717785); background-clip: text; color: transparent; font: 900 clamp(72px, 8vw, 135px)/.68 Arial Narrow, Arial, sans-serif; letter-spacing: -.06em; }
.afterdark-ticket { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: clamp(32px, 4vw, 70px); background: radial-gradient(circle at 70% 50%, #4b0b1b, transparent 55%), #090d1d; border-left: 1px solid #dce0e844; }
.afterdark-ticket > p { margin: 0; color: #a6aaba; letter-spacing: .22em; text-transform: uppercase; }
.afterdark-ticket > strong { font: 800 clamp(54px, 6vw, 94px)/.9 Arial Narrow, Arial, sans-serif; letter-spacing: -.06em; }
.afterdark-ticket > span { color: #f33b3f; letter-spacing: .2em; }
.afterdark-ticket > b { position: absolute; right: 8%; top: 12%; padding: 12px; color: #f33b3f; border: 4px solid; font: 54px Georgia, serif; transform: rotate(-6deg); }
.afterdark-ticket dl { display: grid; grid-template-columns: 1fr 1fr; margin: 30px 0; border: 1px solid #dce0e844; }
.afterdark-ticket dl div { padding: 20px; border-right: 1px solid #dce0e844; }
.afterdark-ticket dt { margin-bottom: 10px; color: #a6aaba; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
.afterdark-ticket dd { margin: 0; font-weight: 800; text-transform: uppercase; }
.afterdark-enter { color: #050710; background: #f0eee8; }

@media (max-width: 960px) {
  .drafts-grid { grid-template-columns: 1fr; }
  .draft-preview-card { display: grid; grid-template-columns: .9fr 1.1fr; }
  .draft-preview-photo { height: 100%; border-right: 2px solid; border-bottom: 0; }
  .neon-hero, .pop-hero, .afterdark-hero { grid-template-columns: 1fr; }
  .neon-hero .draft-photo { grid-column: 1; min-height: 78svh; }
  .pop-collage { min-height: 560px; }
  .afterdark-visual { min-height: 76svh; }
}
@media (max-width: 720px) {
  .landing-drafts { padding: 22px; }
  .drafts-seal { width: 52px; }
  .drafts-intro h1 { margin-top: 80px; font-size: clamp(50px, 17vw, 82px); }
  .draft-preview-card { display: block; box-shadow: 5px 5px 0 var(--ink); }
  .draft-preview-photo { border-right: 0; border-bottom: 2px solid; }
  .draft-preview-copy h2 { min-height: 0; }
  .draft-nav { grid-template-columns: 1fr auto; padding: 10px 14px; }
  .draft-direction-title { display: none; }
  .draft-hero { min-height: 0; }
  .neon-hero .draft-photo { min-height: 82svh; border-left: 0; }
  .neon-title { top: 6%; width: 92%; }
  .neon-title h1 { font-size: clamp(62px, 22vw, 98px); }
  .neon-date { bottom: 19%; font-size: 58px; }
  .neon-sticker { right: 7%; bottom: 25%; width: 86px; }
  .neon-enter { right: 5%; bottom: 4%; width: 140px; }
  .pop-hero { padding: 42px 22px 30px; }
  .pop-copy h1 { font-size: clamp(58px, 19vw, 88px); }
  .pop-date { grid-template-columns: 1fr; }
  .pop-collage { min-height: 470px; margin-top: 42px; }
  .pop-collage .draft-photo { inset: 5% 4% 9%; }
  .pop-stamp { width: 96px; }
  .afterdark-visual { min-height: 72svh; }
  .afterdark-visual > h1 { font-size: clamp(66px, 20vw, 96px); }
  .afterdark-ticket { min-height: 70svh; }
  .afterdark-ticket dl { grid-template-columns: 1fr; }
  .draft-detail-strip { grid-template-columns: 1fr 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .landing-drafts *, .landing-draft * { animation: none !important; scroll-behavior: auto !important; transition-duration: .01ms !important; }
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/components/drafts/draft-index.test.tsx src/components/drafts/wedding-landing-draft.test.tsx`

Expected: all draft component tests pass.

- [ ] **Step 5: Commit the art direction**

```bash
git add src/components/drafts/drafts.css src/components/drafts/draft-index.tsx src/components/drafts/wedding-landing-draft.tsx src/components/drafts/draft-index.test.tsx src/components/drafts/wedding-landing-draft.test.tsx
git commit -m "style: art direct wedding landing drafts"
```

### Task 5: Final verification

**Files:**
- Verify: all files changed by Tasks 1–4.

**Interfaces:**
- Consumes: the completed draft routes and tests.
- Produces: fresh evidence that the branch is ready for review.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all test files pass with zero failures.

- [ ] **Step 2: Run ESLint**

Run: `npm run lint`

Expected: exit code 0 with no errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit code 0 and all four draft routes appear in the route output.

- [ ] **Step 4: Inspect repository state**

Run: `git status --short --branch && git diff --check 1fc397f..HEAD`

Expected: clean worktree and no whitespace errors.
