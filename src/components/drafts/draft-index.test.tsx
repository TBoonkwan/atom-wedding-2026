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
