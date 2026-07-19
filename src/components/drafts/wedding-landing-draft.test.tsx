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
    expect(screen.getAllByText('04.12.2026')).not.toHaveLength(0);
    expect(screen.getAllByText('CELEBCE VENUE')).not.toHaveLength(0);
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
});
