import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DraftIndex } from './draft-index';

const draftStyles = readFileSync(
  resolve(process.cwd(), 'src/components/drafts/drafts.css'),
  'utf8',
);

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

  it('gives index links a scoped visible keyboard focus treatment', () => {
    expect(draftStyles).toContain('.landing-drafts a:focus-visible');
  });
});
