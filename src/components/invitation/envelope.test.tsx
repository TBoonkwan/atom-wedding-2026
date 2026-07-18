import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EnvelopeGate } from './envelope';

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
});
