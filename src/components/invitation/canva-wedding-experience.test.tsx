import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DEMO_PUBLIC_INVITATION } from '@/lib/domain/demo';
import { CanvaWeddingExperience } from './canva-wedding-experience';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('renders the Canva-inspired public invitation without an unsecured RSVP form', () => {
  render(
    <CanvaWeddingExperience
      mode="public"
      calendarLink="#public-calendar"
    />,
  );

  expect(screen.getByRole('heading', { level: 1, name: 'Nathapol & Pennisut' }))
    .toBeInTheDocument();
  expect(screen.getByLabelText('เวลานับถอยหลังถึงวันงาน')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'timing of the day' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'เปิดแผนที่ Celebce Venue' }))
    .toHaveAttribute('href', expect.stringContaining('share.google'));
  expect(screen.getByRole('heading', { name: 'dress code theme' })).toBeInTheDocument();
  expect(screen.getByText('กรุณาเปิดลิงก์คำเชิญส่วนตัวเพื่อส่งคำตอบ')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'ยืนยันคำตอบ' })).not.toBeInTheDocument();
});

it('renders the approved original photography and dress-code artwork', () => {
  render(
    <CanvaWeddingExperience
      mode="public"
      calendarLink="#public-calendar"
    />,
  );

  expect(screen.getByRole('img', { name: 'ณัฐพลและเพ็ญพิสุทธิ์' }).getAttribute('src'))
    .toContain('%2Fcanva-wedding%2Fphotos%2Fhero.webp');
  expect(screen.getByRole('img', { name: 'แนวทางการแต่งกายแบบสุภาพในโทนสีน้ำตาลและเบจ' }).getAttribute('src'))
    .toContain('%2Fcanva-wedding%2Fphotos%2Fdress-code.webp');
  expect(screen.getByRole('img', { name: 'คู่บ่าวสาวบนพรมลายกับชุดราตรีสีแดง' }).getAttribute('src'))
    .toContain('%2Fcanva-wedding%2Fphotos%2Fred-carpet.webp');
});

it('renders the existing RSVP form inside the personalized Canva-inspired invitation', () => {
  render(
    <CanvaWeddingExperience
      mode="personalized"
      token="secure-token"
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
    />,
  );

  expect(screen.getByText(`เรียนเชิญ ${DEMO_PUBLIC_INVITATION.displayName}`)).toBeInTheDocument();
  const rsvp = screen.getByRole('region', { name: 'ตอบรับคำเชิญ' });
  expect(within(rsvp).getByRole('button', { name: 'ไปร่วมงาน' })).toBeInTheDocument();
  expect(within(rsvp).getByRole('button', { name: 'ยืนยันคำตอบ' })).toBeInTheDocument();
  expect(within(rsvp).getByText(`รหัสเชิญ ${DEMO_PUBLIC_INVITATION.inviteCode}`)).toBeInTheDocument();
  expect(within(rsvp).getByText('27.11.2026')).toBeInTheDocument();
  expect(screen.queryByText('กรุณาเปิดลิงก์คำเชิญส่วนตัวเพื่อส่งคำตอบ')).not.toBeInTheDocument();
});

it('keeps the invite code available for the on-site check-in flow without persisting the token', () => {
  const bearerToken = 'secure-token-that-must-not-be-stored';
  const setItem = vi.spyOn(Storage.prototype, 'setItem');

  render(
    <CanvaWeddingExperience
      mode="personalized"
      token={bearerToken}
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
    />,
  );

  expect(setItem).toHaveBeenCalledWith('np-wedding-invite-code', DEMO_PUBLIC_INVITATION.inviteCode);
  expect(setItem.mock.calls.flat().join(' ')).not.toContain(bearerToken);
});

it('keeps the personalized RSVP submission and saved-state flow', async () => {
  const savedInvitation = {
    ...DEMO_PUBLIC_INVITATION,
    status: 'accepted' as const,
    adultCount: 2,
  };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(savedInvitation),
  });
  vi.stubGlobal('fetch', fetchMock);

  render(
    <CanvaWeddingExperience
      mode="personalized"
      token="secure-token"
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));

  await waitFor(() => expect(screen.getByText('ดีใจที่จะได้เจอกัน!')).toBeInTheDocument());
  expect(fetchMock).toHaveBeenCalledWith('/api/invitations/secure-token', expect.objectContaining({
    method: 'POST',
  }));
  expect(screen.getByText('โต๊ะ 8')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Google Calendar' })).toHaveAttribute('href', '#google');
});
