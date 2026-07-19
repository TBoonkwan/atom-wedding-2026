import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EnvelopeGate } from './envelope';

const invitationStyles = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

describe('EnvelopeGate', () => {
  it('reveals the invitation after the guest opens the envelope', () => {
    render(
      <EnvelopeGate>
        <p>รายละเอียดงานแต่ง</p>
      </EnvelopeGate>,
    );

    expect(screen.queryByText('รายละเอียดงานแต่ง')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
    expect(screen.getByText('รายละเอียดงานแต่ง')).toBeInTheDocument();
  });

  it('shows the envelope even when a legacy opened key exists', () => {
    window.localStorage.setItem('returning-envelope', 'opened');

    render(
      <EnvelopeGate>
        <p>ยินดีต้อนรับกลับ</p>
      </EnvelopeGate>,
    );

    expect(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' })).toBeInTheDocument();
    expect(screen.queryByText('ยินดีต้อนรับกลับ')).not.toBeInTheDocument();
  });

  it('does not write browser storage when the envelope opens', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <EnvelopeGate>
        <p>รายละเอียดงานแต่ง</p>
      </EnvelopeGate>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
    expect(setItem).not.toHaveBeenCalled();
  });

  it('keeps the envelope within the padded stage on narrow screens', () => {
    expect(invitationStyles).toMatch(
      /\.envelope-button\s*\{[^}]*width:\s*min\(660px,\s*100%/,
    );
  });

  it('keeps the complete envelope visible on short landscape screens', () => {
    expect(invitationStyles).toContain('calc((100svh - 56px) * 1.55)');
  });

  it('centers against the visible mobile viewport while browser chrome is shown', () => {
    expect(invitationStyles).toMatch(
      /\.envelope-stage\s*\{[^}]*min-height:\s*100svh/,
    );
  });
});
