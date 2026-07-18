import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckInForm } from './checkin-form';

describe('CheckInForm', () => {
  beforeEach(() => window.localStorage.clear());

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('prefills the venue event code and asks for the invitation code', () => {
    render(<CheckInForm eventCode="NP-AT-VENUE" />);

    expect(screen.getByLabelText('รหัส QR หน้างาน')).toHaveValue('NP-AT-VENUE');
    expect(screen.getByLabelText('รหัสคำเชิญ 6 ตัว')).toBeRequired();
    expect(screen.getByLabelText('จำนวนคนที่มาถึง')).toHaveValue(1);
  });

  it('prefills an invitation code remembered by this browser', async () => {
    window.localStorage.setItem('np-wedding-invite-code', 'TEA888');
    render(<CheckInForm eventCode="NP-AT-VENUE" />);

    await waitFor(() => expect(screen.getByLabelText('รหัสคำเชิญ 6 ตัว')).toHaveValue('TEA888'));
    expect(screen.getByText('พบรหัสคำเชิญจาก browser นี้แล้ว')).toBeInTheDocument();
  });

  it('shows every assigned table returned by a successful check-in', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        displayName: 'ครอบครัวใจดี',
        checkedInCount: 2,
        tableNumbers: [2, 13],
      }),
    }));
    render(<CheckInForm eventCode="NP-AT-VENUE" />);
    fireEvent.change(screen.getByLabelText('รหัสคำเชิญ 6 ตัว'), {
      target: { value: 'TEA888' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันเช็กอิน' }));

    expect(await screen.findByText('โต๊ะ 2, 13')).toBeInTheDocument();
  });

  it('keeps the staff fallback when no table is assigned', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        displayName: 'กลุ่มเพื่อนมหาวิทยาลัย',
        checkedInCount: 3,
        tableNumbers: [],
      }),
    }));
    render(<CheckInForm eventCode="NP-AT-VENUE" />);
    fireEvent.change(screen.getByLabelText('รหัสคำเชิญ 6 ตัว'), {
      target: { value: 'DRAG01' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันเช็กอิน' }));

    expect(await screen.findByText('ทีมงานจะแจ้งโต๊ะให้ทราบอีกครั้ง')).toBeInTheDocument();
  });
});
