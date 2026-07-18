import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckInForm } from './checkin-form';

describe('CheckInForm', () => {
  beforeEach(() => window.localStorage.clear());

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
});
