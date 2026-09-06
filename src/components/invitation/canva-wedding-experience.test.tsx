import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DEMO_PUBLIC_INVITATION } from '@/lib/domain/demo';
import { CanvaWeddingExperience } from './canva-wedding-experience';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('renders the Canva-inspired public invitation with a named public RSVP form', () => {
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
  expect(screen.getByLabelText('ชื่อผู้ตอบรับ')).toBeRequired();
  expect(screen.getByRole('button', { name: 'ยืนยันคำตอบ' })).toBeInTheDocument();
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
  expect(within(rsvp).queryByText(/เพื่อเช็กอิน/)).not.toBeInTheDocument();
  expect(within(rsvp).getByText('27.11.2026')).toBeInTheDocument();
  expect(screen.queryByText('กรุณาเปิดลิงก์คำเชิญส่วนตัวเพื่อส่งคำตอบ')).not.toBeInTheDocument();
});

it('does not persist an invitation code or token for check-in', () => {
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

  expect(setItem).not.toHaveBeenCalled();
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

it('keeps YouTube and its music controls out of the invitation', () => {
  render(<CanvaWeddingExperience mode="public" calendarLink="#calendar" />);
  expect(screen.queryByTitle('Let It Be — The Beatles')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'เปิดเพลงคลอ' })).not.toBeInTheDocument();
});

it('submits a name from the shared link and shows confirmation', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...DEMO_PUBLIC_INVITATION, displayName: 'คุณใหม่', status: 'accepted' }) }));
  render(<CanvaWeddingExperience mode="public" calendarLink="#calendar" />);
  fireEvent.change(screen.getByLabelText('ชื่อผู้ตอบรับ'), { target: { value: 'คุณใหม่' } });
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));
  expect(await screen.findByText(/บันทึกคำตอบแล้ว/)).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('/api/rsvp', expect.objectContaining({ body: expect.stringContaining('คุณใหม่') }));
});
