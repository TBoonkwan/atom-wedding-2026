# Afterdark Full Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/drafts/afterdark-ticket` into a complete scrollable wedding landing-page preview while keeping every production route unchanged.

**Architecture:** Add one server-rendered `AfterdarkFullSections` unit beside the existing hero, consuming `TIMELINE` and `WEDDING` from the domain module. Extend the existing scoped draft stylesheet and component tests; do not add state, dependencies, APIs, or a second data model.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `next/image`, existing domain constants, Vitest, React Testing Library, CSS.

## Global Constraints

- Modify only the draft component, its test, and the scoped draft stylesheet.
- Render the full page only for `theme === 'afterdark-ticket'`; Neon and Pop remain hero-only drafts.
- Use every existing `TIMELINE` item and the existing `WEDDING.venue`, `WEDDING.address`, and `WEDDING.mapUrl` values.
- Use exactly four existing images: `/gallery/photo-02.jpg`, `/gallery/photo-03.jpg`, `/gallery/photo-04.jpg`, and `/gallery/photo-07.jpg`.
- RSVP is an explicitly labelled non-interactive preview; do not add fake form behavior.
- Preserve semantic headings, ordered schedule data, native links, accurate alt text, focus styles, reduced motion, and 320 px responsive support.
- Do not modify `/`, invitation personalization, RSVP APIs, music, envelope, gallery lightbox, host, check-in, Supabase, or backend code.

---

### Task 1: Full Afterdark content and tests

**Files:**
- Modify: `src/components/drafts/wedding-landing-draft.test.tsx`
- Modify: `src/components/drafts/wedding-landing-draft.tsx`

**Interfaces:**
- Consumes: `TIMELINE` and `WEDDING` from `@/lib/domain/event`.
- Produces: internal `AfterdarkFullSections` rendered only by `WeddingLandingDraft({ theme: 'afterdark-ticket' })`.

- [ ] **Step 1: Add failing full-page behavior tests**

```tsx
import { TIMELINE, WEDDING } from '@/lib/domain/event';

it('renders the complete Afterdark landing sections from domain data', () => {
  render(<WeddingLandingDraft theme="afterdark-ticket" />);
  expect(screen.getByRole('heading', { name: 'The running order' })).toBeInTheDocument();
  TIMELINE.forEach((item) => {
    expect(screen.getByText(item.time)).toBeInTheDocument();
    expect(screen.getByText(item.title)).toBeInTheDocument();
  });
  expect(screen.getByRole('heading', { name: WEDDING.venue })).toBeInTheDocument();
  expect(screen.getByText(WEDDING.address)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'เปิดแผนที่และนำทาง' }))
    .toHaveAttribute('href', WEDDING.mapUrl);
  expect(screen.getByRole('heading', { name: 'Wedding colors' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Before we meet' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'RSVP preview' })).toBeInTheDocument();
  expect(screen.getByText(/ฟอร์มจริงจะแสดงบนลิงก์เชิญส่วนตัว/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to top' })).toHaveAttribute('href', '#afterdark-top');
});

it('shows four accessible editorial gallery images', () => {
  render(<WeddingLandingDraft theme="afterdark-ticket" />);
  expect(screen.getAllByRole('img')).toHaveLength(5);
  expect(screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดสีดำยืนใกล้กัน' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'ภาพสตูดิโอของณัฐพลและเพ็ญพิสุทธิ์' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานจีนสีแดง' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานสีขาว' })).toBeInTheDocument();
});

it.each(['neon-editorial', 'pop-postcard'] as const)(
  'keeps %s as a hero-only draft',
  (theme) => {
    render(<WeddingLandingDraft theme={theme} />);
    expect(screen.queryByRole('heading', { name: 'The running order' })).not.toBeInTheDocument();
  },
);
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/components/drafts/wedding-landing-draft.test.tsx`

Expected: FAIL because the full Afterdark headings, gallery, and back-to-top link do not exist.

- [ ] **Step 3: Add the full server-rendered component**

Create local immutable gallery and palette data, then implement the component with this exact structure:

```tsx
const afterdarkGallery = [
  { src: '/gallery/photo-02.jpg', alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดสีดำยืนใกล้กัน' },
  { src: '/gallery/photo-03.jpg', alt: 'ภาพสตูดิโอของณัฐพลและเพ็ญพิสุทธิ์' },
  { src: '/gallery/photo-04.jpg', alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานจีนสีแดง' },
  { src: '/gallery/photo-07.jpg', alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานสีขาว' },
] as const;

const weddingColors = [
  { number: '01', name: 'Chocolate Brown', value: '#553725' },
  { number: '02', name: 'Mocha', value: '#987863' },
  { number: '03', name: 'Dusty Pink', value: '#d1afa6' },
  { number: '04', name: 'Blush Pink', value: '#d5acab' },
] as const;

function AfterdarkFullSections() {
  return (
    <div className="afterdark-full">
      <section className="afterdark-section afterdark-schedule" aria-labelledby="afterdark-schedule-heading">
        <p className="afterdark-kicker">03 / RUNNING ORDER</p>
        <h2 id="afterdark-schedule-heading">The running order</h2>
        <ol>
          {TIMELINE.map((item, index) => (
            <li key={item.time}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <time>{item.time}</time>
              <i aria-hidden="true">{item.icon}</i>
              <strong>{item.title}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="afterdark-section afterdark-venue" aria-labelledby="afterdark-venue-heading">
        <div className="afterdark-map-grid" aria-hidden="true"><span>CELEBCE</span><b>04.12</b></div>
        <div className="afterdark-venue-copy">
          <p className="afterdark-kicker">04 / LOCATION</p>
          <h2 id="afterdark-venue-heading">{WEDDING.venue}</h2>
          <p>{WEDDING.address}</p>
          <a href={WEDDING.mapUrl} target="_blank" rel="noreferrer">เปิดแผนที่และนำทาง</a>
        </div>
      </section>

      <section className="afterdark-section afterdark-colors" aria-labelledby="afterdark-colors-heading">
        <p className="afterdark-kicker">05 / DRESS CODE</p>
        <h2 id="afterdark-colors-heading">Wedding colors</h2>
        <ul>{weddingColors.map((color) => <li key={color.name}><span style={{ background: color.value }} aria-hidden="true" /><b>{color.number}</b><strong>{color.name}</strong></li>)}</ul>
      </section>

      <section className="afterdark-section afterdark-gallery" aria-labelledby="afterdark-gallery-heading">
        <p className="afterdark-kicker">06 / CONTACT SHEET</p>
        <h2 id="afterdark-gallery-heading">Before we meet</h2>
        <div>{afterdarkGallery.map((image, index) => <figure key={image.src}><Image src={image.src} alt={image.alt} width={1200} height={1800} sizes="(max-width: 720px) calc(100vw - 40px), 50vw" loading="lazy" /><figcaption>{String(index + 1).padStart(2, '0')} / 04</figcaption></figure>)}</div>
      </section>

      <section className="afterdark-section afterdark-rsvp" aria-labelledby="afterdark-rsvp-heading">
        <p className="afterdark-preview-label">Preview only</p>
        <p className="afterdark-kicker">07 / RESPONSE</p>
        <h2 id="afterdark-rsvp-heading">RSVP preview</h2>
        <p>ฟอร์มจริงจะแสดงบนลิงก์เชิญส่วนตัวของแขกแต่ละคน</p>
        <ul aria-label="ตัวเลือกตอบรับคำเชิญ"><li>มาร่วมงาน</li><li>ยังไม่แน่ใจ</li><li>ไม่สะดวกมาร่วม</li></ul>
      </section>

      <footer className="afterdark-closing"><span>NP</span><p>04 · 12 · 2026</p><a href="#afterdark-top">Back to top</a></footer>
    </div>
  );
}
```

Set `id="afterdark-top"` on the Afterdark page root and render `<AfterdarkFullSections />` immediately after the existing event pass strip only for the Afterdark theme. Use `Image` width/height and responsive `sizes`; keep gallery images lazy-loaded.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- src/components/drafts/wedding-landing-draft.test.tsx`

Expected: all focused tests pass.

- [ ] **Step 5: Commit content and behavior**

```bash
git add src/components/drafts/wedding-landing-draft.tsx src/components/drafts/wedding-landing-draft.test.tsx
git commit -m "feat: expand afterdark wedding draft"
```

### Task 2: Full-page art direction, responsive contract, and verification

**Files:**
- Modify: `src/components/drafts/wedding-landing-draft.test.tsx`
- Modify: `src/components/drafts/drafts.css`

**Interfaces:**
- Consumes: the semantic classes added in Task 1.
- Produces: complete Afterdark section layouts scoped under `.landing-draft[data-draft="afterdark-ticket"]`.

- [ ] **Step 1: Add failing CSS contract assertions**

```tsx
it('styles every full Afterdark section within the scoped draft surface', () => {
  [
    '.landing-draft[data-draft="afterdark-ticket"] .afterdark-full',
    '.landing-draft[data-draft="afterdark-ticket"] .afterdark-schedule',
    '.landing-draft[data-draft="afterdark-ticket"] .afterdark-venue',
    '.landing-draft[data-draft="afterdark-ticket"] .afterdark-colors',
    '.landing-draft[data-draft="afterdark-ticket"] .afterdark-gallery',
    '.landing-draft[data-draft="afterdark-ticket"] .afterdark-rsvp',
    '.landing-draft[data-draft="afterdark-ticket"] .afterdark-closing',
  ].forEach((selector) => expect(draftStyles).toContain(selector));
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/components/drafts/wedding-landing-draft.test.tsx`

Expected: FAIL because the new scoped selectors do not exist.

- [ ] **Step 3: Implement scoped art direction**

Use the existing Afterdark tokens `--bg #050710`, `--fg #f0eee8`, and `--hot #f33b3f`. Add:

- `.afterdark-full` with subtle spotlight gradients and ticket-grid dividers.
- `.afterdark-section` with `width: min(1180px, calc(100% - 40px))` and responsive block padding.
- A five-row numbered schedule whose odd/even rows offset on desktop and flatten at 720 px.
- A two-column venue ticket with a CSS grid-map panel and native link styled as an outlined admission control.
- A four-column color-token grid using `#553725`, `#987863`, `#d1afa6`, and `#d5acab`.
- A two-column gallery with alternating `4 / 5` and `3 / 2` image ratios; each figure has positioned ancestry and `overflow: hidden`.
- A centered RSVP-preview ticket with three display-only rows and a visible preview label.
- A closing section with oversized chrome `NP`, compact date, and back-to-top link.
- At the existing 960 px breakpoint, stack venue and reduce gallery width; at 720 px, use one-column schedule/venue/gallery and two-column palette; preserve the existing reduced-motion block.

- [ ] **Step 4: Run all verification**

Run: `npm test -- src/components/drafts/wedding-landing-draft.test.tsx`

Expected: focused tests pass.

Run: `npm test`

Expected: all tests pass.

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0 and `/drafts/afterdark-ticket` remains a static route.

- [ ] **Step 5: Commit art direction**

```bash
git add src/components/drafts/drafts.css src/components/drafts/wedding-landing-draft.test.tsx
git commit -m "style: complete afterdark landing page"
```
