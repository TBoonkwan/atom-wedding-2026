import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeddingLandingDraft } from './wedding-landing-draft';

const draftStylesPath = resolve(process.cwd(), 'src/components/drafts/drafts.css');
const draftStyles = existsSync(draftStylesPath) ? readFileSync(draftStylesPath, 'utf8') : '';

describe('WeddingLandingDraft', () => {
  it.each([
    ['neon-editorial', 'Neon Editorial Party'],
    ['pop-postcard', 'Pop Postcard Collage'],
    ['afterdark-ticket', 'Afterdark Ticket Club'],
  ] as const)('renders %s with shared wedding facts', (theme, title) => {
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

  it('provides draft switching and an in-page enter action', () => {
    render(<WeddingLandingDraft theme="neon-editorial" />);
    expect(screen.getAllByRole('link', { name: /view .* draft/i })).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Enter our wedding' })).toHaveAttribute(
      'href',
      '#draft-details',
    );
  });

  it('ships scoped responsive styles and reduced-motion support', () => {
    expect(draftStyles).toContain('[data-draft="neon-editorial"]');
    expect(draftStyles).toContain('[data-draft="pop-postcard"]');
    expect(draftStyles).toContain('[data-draft="afterdark-ticket"]');
    expect(draftStyles).toContain('@media (max-width: 720px)');
    expect(draftStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(draftStyles).toContain(':focus-visible');
  });
});
