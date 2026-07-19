import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TIMELINE, WEDDING } from '@/lib/domain/event';
import { WeddingLandingDraft } from './wedding-landing-draft';

const draftStylesPath = resolve(process.cwd(), 'src/components/drafts/drafts.css');
const draftStyles = existsSync(draftStylesPath) ? readFileSync(draftStylesPath, 'utf8') : '';
const draftSource = readFileSync(
  resolve(process.cwd(), 'src/components/drafts/wedding-landing-draft.tsx'),
  'utf8',
);
const themes = [
  ['neon-editorial', 'Neon Editorial Party'],
  ['pop-postcard', 'Pop Postcard Collage'],
  ['afterdark-ticket', 'Afterdark Ticket Club'],
] as const;
const draftHrefs = [
  '/drafts/neon-editorial',
  '/drafts/pop-postcard',
  '/drafts/afterdark-ticket',
];

describe('WeddingLandingDraft', () => {
  it.each(themes)('renders %s with shared wedding facts', (theme, title) => {
    render(<WeddingLandingDraft theme={theme} />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getAllByText('04.12.2026')).not.toHaveLength(0);
    expect(screen.getAllByText('FRIDAY · 15:00')).not.toHaveLength(0);
    expect(screen.getAllByText('CELEBCE VENUE')).not.toHaveLength(0);
    expect(screen.getAllByText('Tea ceremony · Dinner · After party')).not.toHaveLength(0);
    if (theme === 'pop-postcard') {
      expect(
        screen.getByText('Tea ceremony · Dinner · After party', {
          selector: '.pop-note',
        }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole('img', { name: /holding their wedding rings/i }),
    ).toBeInTheDocument();
  });

  it.each(themes)(
    'provides exact draft switching, CTA, and details landmark for %s',
    (theme) => {
      render(<WeddingLandingDraft theme={theme} />);
      const navigation = screen.getByRole('navigation', { name: 'Draft navigation' });
      const switcherLinks = within(navigation).getAllByRole('link', {
        name: /view .* draft/i,
      });

      expect(switcherLinks.map((link) => link.getAttribute('href'))).toEqual(draftHrefs);
      expect(screen.getByRole('link', { name: 'Enter our wedding' })).toHaveAttribute(
        'href',
        '#draft-details',
      );
      expect(
        screen.getByRole('region', { name: 'Wedding event details' }),
      ).toHaveAttribute('id', 'draft-details');
    },
  );

  it('renders the approved assistive-technology-hidden barcode and numbered ticket rows', () => {
    const { container } = render(<WeddingLandingDraft theme="afterdark-ticket" />);
    const barcode = container.querySelector('.afterdark-barcode');
    const numbers = Array.from(
      container.querySelectorAll('.afterdark-detail-number'),
      (number) => number.textContent,
    );

    expect(barcode).toHaveAttribute('aria-hidden', 'true');
    expect(numbers).toEqual(['01', '02']);
  });

  it('renders the complete Afterdark landing sections from domain data', () => {
    render(<WeddingLandingDraft theme="afterdark-ticket" />);

    expect(screen.getByRole('heading', { name: 'The running order' })).toBeInTheDocument();
    TIMELINE.forEach((item) => {
      expect(screen.getByText(item.time)).toBeInTheDocument();
      expect(screen.getByText(item.title)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: WEDDING.venue })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Wedding colors' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Before we meet' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'RSVP preview' })).toBeInTheDocument();
    expect(screen.getByText(/ฟอร์มจริงจะแสดงบนลิงก์เชิญส่วนตัว/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to top' })).toHaveAttribute(
      'href',
      '#afterdark-top',
    );
  });

  it('shows Celebce as an editorial venue image without duplicate location details', () => {
    render(<WeddingLandingDraft theme="afterdark-ticket" />);

    expect(
      screen.getByRole('img', { name: 'ห้องจัดพิธีภายใน Celebce Venue' }),
    ).toHaveAttribute(
      'src',
      expect.stringContaining('%2Fimages%2Fdrafts%2Fcelebce-venue.jpg'),
    );
    expect(screen.queryByText(WEDDING.address)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'เปิดแผนที่และนำทาง' }),
    ).not.toBeInTheDocument();
  });

  it('places wedding colors as the final content section before the closing mark', () => {
    const { container } = render(<WeddingLandingDraft theme="afterdark-ticket" />);
    const afterdarkSections = Array.from(
      container.querySelector('.afterdark-full')?.children ?? [],
    );

    expect(afterdarkSections.at(-2)).toHaveClass('afterdark-colors');
    expect(afterdarkSections.at(-1)).toHaveClass('afterdark-closing');
  });

  it('shows four accessible editorial gallery images', () => {
    const { container } = render(<WeddingLandingDraft theme="afterdark-ticket" />);

    expect(container.querySelectorAll('.afterdark-gallery img')).toHaveLength(4);
    expect(
      screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดสีดำยืนใกล้กัน' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'ภาพสตูดิโอของณัฐพลและเพ็ญพิสุทธิ์' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานจีนสีแดง' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานสีขาว' }),
    ).toBeInTheDocument();
  });

  it.each(['neon-editorial', 'pop-postcard'] as const)(
    'keeps %s as a hero-only draft',
    (theme) => {
      render(<WeddingLandingDraft theme={theme} />);

      expect(
        screen.queryByRole('heading', { name: 'The running order' }),
      ).not.toBeInTheDocument();
    },
  );

  it('derives hero partner names once from the shared wedding facts', () => {
    expect(draftSource).toContain(
      "const [partnerOne, partnerTwo] = facts.names.split(' & ');",
    );
    expect(draftSource).not.toMatch(/NATHAPOL|PENNISUT/);
  });

  it('uses responsive image sizes matching the 960px hero collapse', () => {
    render(<WeddingLandingDraft theme="neon-editorial" />);
    expect(
      screen.getByRole('img', { name: /holding their wedding rings/i }),
    ).toHaveAttribute('sizes', '(max-width: 960px) 100vw, 64vw');
  });

  it('ships root reduced-motion, selector isolation, and approved motif contracts', () => {
    expect(draftStyles).toContain(
      'html:has(.landing-drafts),\n  html:has(.landing-draft) { scroll-behavior: auto !important; }',
    );
    expect(draftStyles).not.toMatch(
      /(?:^|,)\s*(?:\.draft(?:s|-)|\.neon-|\.pop-|\.afterdark-|\[data-draft=)/m,
    );
    expect(draftStyles).toContain(
      '.landing-draft[data-draft="pop-postcard"] .pop-collage .draft-photo::before',
    );
    expect(draftStyles).toContain('background: #087f78;');
    expect(draftStyles).toContain(
      '.landing-draft[data-draft="afterdark-ticket"] .afterdark-barcode',
    );
    expect(draftStyles).toContain('repeating-linear-gradient');
  });

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

  it('ships scoped responsive styles and reduced-motion support', () => {
    expect(draftStyles).toContain('[data-draft="neon-editorial"]');
    expect(draftStyles).toContain('[data-draft="pop-postcard"]');
    expect(draftStyles).toContain('[data-draft="afterdark-ticket"]');
    expect(draftStyles).toContain('@media (max-width: 720px)');
    expect(draftStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(draftStyles).toContain(':focus-visible');
  });

  it('shows complete vertical gallery images on small screens instead of center-cropping', () => {
    expect(draftStyles).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.afterdark-gallery figure \{ aspect-ratio: auto; \}/,
    );
    expect(draftStyles).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.afterdark-gallery figure img \{ position: static; height: auto; object-fit: contain; \}/,
    );
  });
});
