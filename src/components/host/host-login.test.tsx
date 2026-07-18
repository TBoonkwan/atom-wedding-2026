import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HostLogin } from './host-login';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

describe('HostLogin', () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it('signs in with the pilot username and password', async () => {
    const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ signedIn: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<HostLogin />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ Dashboard' }));

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(request).toHaveBeenCalledWith('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '1234' }),
    });
  });

  it('shows an error and stays on the login page when credentials are wrong', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Username หรือ Password ไม่ถูกต้อง' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<HostLogin />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ Dashboard' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Username หรือ Password ไม่ถูกต้อง');
    expect(refresh).not.toHaveBeenCalled();
  });
});
