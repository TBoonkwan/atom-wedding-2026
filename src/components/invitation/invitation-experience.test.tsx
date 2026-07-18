import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PUBLIC_INVITATION } from '@/lib/domain/demo';
import { InvitationExperience, isSectionInViewport } from './invitation-experience';

function holdAnimationFrame() {
  let callback: FrameRequestCallback | undefined;
  const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((next) => {
    callback = next;
    return 1;
  });
  const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

  return {
    flush() {
      expect(callback).toBeDefined();
      callback?.(0);
    },
    restore() {
      requestAnimationFrame.mockRestore();
      cancelAnimationFrame.mockRestore();
    },
  };
}

function openModernInvitation() {
  fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
  fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
}

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('InvitationExperience', () => {
  it('renders the public wedding details without invitation-only actions', () => {
    render(<InvitationExperience theme="modern-xi-club" mode="public" />);

    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

    expect(screen.getByText('เรียนเชิญร่วมเป็นส่วนหนึ่งในวันของเรา')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'ตอบรับ' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'แล้วเจอกันไหม?' })).not.toBeInTheDocument();
    expect(screen.queryByText('วันงานเช็กอินเองได้')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Google Calendar' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem('np-wedding-invite-code')).toBeNull();
  });

  it('shows compact section shortcuts after the envelope opens', () => {
    window.localStorage.removeItem('np-wedding-envelope-modern-xi-club');
    render(
      <InvitationExperience
        theme="modern-xi-club"
        token="demo-np-2026"
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

    const navigation = screen.getByRole('navigation', { name: 'ทางลัด' });
    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ตอบรับ' })).toHaveAttribute('href', '#rsvp');
    expect(screen.getByRole('link', { name: 'รูปเรา' })).toHaveAttribute('href', '#gallery');
  });

  it('shows the compact detail header and wedding color palette after opening the envelope', () => {
    window.localStorage.removeItem('np-wedding-envelope-modern-xi-club');
    render(
      <InvitationExperience
        theme="modern-xi-club"
        token="wedding-colors-demo"
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

    expect(document.getElementById('invitation-detail-heading')?.closest('header')).toHaveClass('detail-hero');
    const colorSection = screen.getByRole('heading', { name: 'Wedding Colors' }).closest('section');
    expect(colorSection).toHaveClass('wedding-colors-section');
    expect(within(colorSection as HTMLElement).getAllByRole('listitem').map((item) => item.textContent))
      .toEqual(['Chocolate Brown', 'Mocha', 'Dusty Pink', 'Blush Pink']);
  });

  it('reveals content for a first-time guest after the envelope opens', async () => {
    window.localStorage.removeItem('np-wedding-envelope-modern-xi-club');
    render(
      <InvitationExperience
        theme="modern-xi-club"
        token="first-time-demo"
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'กำหนดการ' }).closest('section'))
        .toHaveClass('is-visible');
    });
  });

  it('renders only the four selected portraits in the detail gallery', () => {
    render(
      <InvitationExperience
        theme="modern-xi-club"
        token="single-gallery-demo"
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    openModernInvitation();
    const gallerySection = screen.getByRole('heading', { name: 'ก่อนเราจะเจอกัน' })
      .closest('section');
    expect(gallerySection).not.toBeNull();
    const triggers = within(gallerySection as HTMLElement)
      .getAllByRole('button', { name: /เปิดภาพ/ });
    expect(triggers).toHaveLength(4);
    expect(triggers.map((trigger) => within(trigger).getByRole('img').getAttribute('src')))
      .toEqual(expect.arrayContaining([
        expect.stringContaining('photo-02.jpg'),
        expect.stringContaining('photo-03.jpg'),
        expect.stringContaining('photo-04.jpg'),
        expect.stringContaining('photo-07.jpg'),
      ]));
  });

  it.each(['blush-shanghai', 'tea-to-toast'] as const)(
    'keeps the legacy single-image gallery for the %s theme',
    (theme) => {
      render(
        <InvitationExperience
          theme={theme}
          token={`legacy-${theme}-token`}
          initialInvitation={DEMO_PUBLIC_INVITATION}
          calendarLinks={{ google: '#google', ics: '#ics' }}
          preview
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

      const gallerySection = screen.getByRole('heading', { name: 'ก่อนเราจะเจอกัน' })
        .closest('section');
      expect(gallerySection).not.toBeNull();
      expect(gallerySection?.querySelector('.gallery-grid')).toBeInTheDocument();
      expect(gallerySection?.querySelector('.gallery-feature')).toBeInTheDocument();
      expect(within(gallerySection as HTMLElement).getAllByRole('img')).toHaveLength(1);
      expect(within(gallerySection as HTMLElement).getByRole('img', {
        name: 'ภาพขาวดำของณัฐพลและเพ็ญพิสุทธิ์ถือแหวนแต่งงาน',
      })).toHaveAttribute('src', expect.stringContaining('photo-08.jpg'));
      expect(within(gallerySection as HTMLElement).queryByRole('button', { name: /เปิดภาพ/ }))
        .not.toBeInTheDocument();
      expect(gallerySection?.querySelector('.gallery-reel')).not.toBeInTheDocument();
    },
  );

  it.each(['pending', 'maybe', 'rejected'] as const)(
    'does not offer calendar actions when the RSVP status is %s',
    (status) => {
      render(
        <InvitationExperience
          theme="modern-xi-club"
          token="pending-calendar-demo"
          initialInvitation={{ ...DEMO_PUBLIC_INVITATION, status }}
          calendarLinks={{ google: '#google', ics: '#ics' }}
          preview
        />,
      );

      openModernInvitation();
      expect(screen.queryByText('เพิ่มลงปฏิทินไว้เลย')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Google Calendar' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Apple / Outlook' })).not.toBeInTheDocument();
    },
  );

  it('offers calendar actions after the guest accepts', () => {
    render(
      <InvitationExperience
        theme="modern-xi-club"
        token="accepted-calendar-demo"
        initialInvitation={{
          ...DEMO_PUBLIC_INVITATION,
          status: 'accepted',
          adultCount: 2,
        }}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    openModernInvitation();
    expect(screen.getByText('เพิ่มลงปฏิทินไว้เลย')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Google Calendar' })).toHaveAttribute('href', '#google');
    expect(screen.getByRole('link', { name: 'Apple / Outlook' })).toHaveAttribute('href', '#ics');
  });

  it('treats an anchor-aligned section as visible for reveal animation', () => {
    const section = document.createElement('section');
    section.getBoundingClientRect = () => ({ top: -1, bottom: 240 } as DOMRect);

    expect(isSectionInViewport(section, 800)).toBe(true);
  });

  it('shows the landing and envelope on every Modern visit before details', () => {
    window.localStorage.setItem('np-wedding-envelope-modern-xi-club', 'opened');
    const entryFrame = holdAnimationFrame();
    render(
      <InvitationExperience
        theme="modern-xi-club"
        token="returning-demo"
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    expect(screen.getByRole('button', { name: 'Enter to our wedding' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    expect(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' })).toBeInTheDocument();
    entryFrame.flush();
    expect(document.activeElement).toBe(document.getElementById('invitation-envelope-button'));

    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
    entryFrame.flush();
    expect(document.activeElement).toBe(document.getElementById('invitation-detail-heading'));
    entryFrame.restore();
  });

  it('stores the invite code but never persists envelope state or the bearer token', () => {
    const bearerToken = 'raw-secret-invitation-token';
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <InvitationExperience
        theme="modern-xi-club"
        token={bearerToken}
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

    expect(setItem).toHaveBeenCalledWith('np-wedding-invite-code', DEMO_PUBLIC_INVITATION.inviteCode);
    const storageKeys = setItem.mock.calls.map(([key]) => String(key));
    expect(storageKeys.some((key) => key.startsWith('np-wedding-envelope-'))).toBe(false);
    expect(storageKeys.every((key) => !key.includes(bearerToken))).toBe(true);
  });
});
