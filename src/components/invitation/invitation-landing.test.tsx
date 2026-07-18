import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { InvitationLanding } from './invitation-landing';

const invitationStyles = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

describe('InvitationLanding', () => {
  it('shows the complete ring portrait as the invitation entry', () => {
    render(<InvitationLanding onEnter={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์ถือแหวนแต่งงาน' }))
      .toHaveClass('invitation-landing-portrait');
    expect(screen.getByRole('button', { name: 'Enter to our wedding' })).toBeInTheDocument();
  });

  it('enters when the guest activates the button', () => {
    const onEnter = vi.fn();
    render(<InvitationLanding onEnter={onEnter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    expect(onEnter).toHaveBeenCalledOnce();
  });

  it('keeps the complete foreground portrait at or below full scale', () => {
    expect(invitationStyles).toContain(
      '@keyframes invitation-landing-portrait-zoom { from { transform: scale(.985); } to { transform: scale(1); } }',
    );
    expect(invitationStyles).toContain(
      '@keyframes invitation-landing-backdrop-zoom { from { transform: scale(1.09); } to { transform: scale(1.13); } }',
    );
  });
});
