import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestCreateModal } from './guest-create-modal';

describe('GuestCreateModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requires both invitation and contact names', () => {
    const request = vi.spyOn(globalThis, 'fetch');
    render(<GuestCreateModal onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.getByLabelText('ชื่อบนคำเชิญ')).toBeRequired();
    expect(screen.getByLabelText('ชื่อผู้ติดต่อ')).toBeRequired();
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มแขกและสร้างลิงก์' }));

    expect(request).not.toHaveBeenCalled();
  });

  it('submits guest details and hands the one-time link to the dashboard', async () => {
    const link = {
      displayName: 'ครอบครัวสุขใจ',
      inviteCode: 'ABC123',
      token: 'raw-token',
    };
    const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ imported: 1, links: [link] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const onCreated = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<GuestCreateModal onClose={onClose} onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText('ชื่อบนคำเชิญ'), {
      target: { value: 'ครอบครัวสุขใจ' },
    });
    fireEvent.change(screen.getByLabelText('ชื่อผู้ติดต่อ'), { target: { value: 'คุณเอ' } });
    fireEvent.change(screen.getByLabelText('โทรศัพท์'), { target: { value: '0812345678' } });
    fireEvent.change(screen.getByLabelText('อีเมล'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('โน้ต host'), { target: { value: 'เพื่อนเจ้าบ่าว' } });
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มแขกและสร้างลิงก์' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith([link]));
    expect(request).toHaveBeenCalledWith('/api/host/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest: {
          displayName: 'ครอบครัวสุขใจ',
          contactName: 'คุณเอ',
          phone: '0812345678',
          email: 'a@example.com',
          hostNotes: 'เพื่อนเจ้าบ่าว',
        },
      }),
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps entered values visible when the server rejects the guest', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: ['email หรือโทรศัพท์มีอยู่ในระบบแล้ว'] }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const onClose = vi.fn();
    render(<GuestCreateModal onClose={onClose} onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('ชื่อบนคำเชิญ'), {
      target: { value: 'ครอบครัวซ้ำ' },
    });
    fireEvent.change(screen.getByLabelText('ชื่อผู้ติดต่อ'), { target: { value: 'คุณซ้ำ' } });
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มแขกและสร้างลิงก์' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('email หรือโทรศัพท์มีอยู่ในระบบแล้ว');
    expect(screen.getByLabelText('ชื่อบนคำเชิญ')).toHaveValue('ครอบครัวซ้ำ');
    expect(screen.getByLabelText('ชื่อผู้ติดต่อ')).toHaveValue('คุณซ้ำ');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a useful error and keeps the modal open after a network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const onClose = vi.fn();
    render(<GuestCreateModal onClose={onClose} onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('ชื่อบนคำเชิญ'), {
      target: { value: 'ครอบครัวออฟไลน์' },
    });
    fireEvent.change(screen.getByLabelText('ชื่อผู้ติดต่อ'), { target: { value: 'คุณออฟไลน์' } });
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มแขกและสร้างลิงก์' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('เชื่อมต่อระบบไม่สำเร็จ');
    expect(onClose).not.toHaveBeenCalled();
  });
});
