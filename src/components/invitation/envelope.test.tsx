import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EnvelopeGate } from './envelope';

describe('EnvelopeGate', () => {
  it('reveals the invitation after the guest opens the envelope', () => {
    render(
      <EnvelopeGate storageKey="test-envelope">
        <p>รายละเอียดงานแต่ง</p>
      </EnvelopeGate>,
    );

    expect(screen.queryByText('รายละเอียดงานแต่ง')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
    expect(screen.getByText('รายละเอียดงานแต่ง')).toBeInTheDocument();
  });

  it('skips the envelope when this invitation was opened before', async () => {
    window.localStorage.setItem('returning-envelope', 'opened');
    render(
      <EnvelopeGate storageKey="returning-envelope">
        <p>ยินดีต้อนรับกลับ</p>
      </EnvelopeGate>,
    );

    await waitFor(() => expect(screen.getByText('ยินดีต้อนรับกลับ')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'เปิดซองคำเชิญ' })).not.toBeInTheDocument();
  });

  it('still opens for this session when local storage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    try {
      render(
        <EnvelopeGate storageKey="unavailable-envelope">
          <p>รายละเอียดงานแต่ง</p>
        </EnvelopeGate>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
      expect(screen.getByText('รายละเอียดงานแต่ง')).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
