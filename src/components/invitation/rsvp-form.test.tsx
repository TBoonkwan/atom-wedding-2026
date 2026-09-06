import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PUBLIC_INVITATION } from '@/lib/domain/demo';
import { RsvpForm } from './rsvp-form';

describe('RsvpForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows attendance fields for an accepted response', () => {
    render(<RsvpForm token="demo" onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'มา' }));

    expect(screen.getByLabelText('ผู้ใหญ่')).toBeInTheDocument();
    expect(screen.getByLabelText('เด็ก')).toBeInTheDocument();
    expect(screen.getByLabelText('เก้าอี้เด็ก')).toBeInTheDocument();
    expect(screen.getByLabelText('คราฟต์เบียร์ที่ชอบ')).toBeInTheDocument();
  });

  it.each([
    ['อาจจะ', 'maybe'],
    ['มาไม่ได้', 'rejected'],
  ] as const)('submits %s without requesting a reason or gift', async (choice, status) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<RsvpForm token="demo" onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: choice }));
    expect(screen.queryByLabelText('บอกเหตุผลให้เราทราบ')).not.toBeInTheDocument();
    expect(screen.queryByText(/ซองออนไลน์/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('ผู้ใหญ่')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({ status, reason: '' });
  });

  it('clears a previous reason when the guest changes to attending', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <RsvpForm
        token="changed-response"
        initial={{
          ...DEMO_PUBLIC_INVITATION,
          status: 'maybe',
          adultCount: 0,
          childCount: 0,
          reason: 'รอเช็กตารางงาน',
        }}
        onSaved={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'มา' }));
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({ status: 'accepted', reason: '' });
  });

  it('submits a new accepted response with an empty song request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<RsvpForm token="demo" onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'มา' }));
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(screen.queryByLabelText('เพลงที่อยากฟังใน After Party')).not.toBeInTheDocument();
    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({ songRequest: '' });
  });

  it('hides and preserves a historical song request when editing an RSVP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <RsvpForm
        token="historical-song"
        initial={{
          ...DEMO_PUBLIC_INVITATION,
          status: 'accepted',
          adultCount: 2,
          songRequest: 'The historical first-dance song',
        }}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('เพลงที่อยากฟังใน After Party')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({
      songRequest: 'The historical first-dance song',
    });
  });

  it('clears attendance-only details when an existing response changes to maybe', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <RsvpForm
        token="change-to-maybe"
        initial={{
          ...DEMO_PUBLIC_INVITATION,
          status: 'accepted',
          adultCount: 2,
          dietaryNotes: 'ไม่ทานเนื้อ',
          beerPreference: 'ipa',
          songRequest: 'The historical first-dance song',
        }}
        onSaved={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'อาจจะ' }));
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันคำตอบ' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({
      status: 'maybe',
      adultCount: 0,
      dietaryNotes: '',
      beerPreference: 'none',
      songRequest: '',
    });
  });
});
