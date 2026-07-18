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

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('InvitationExperience', () => {
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
    window.localStorage.setItem('np-wedding-envelope-modern-xi-club', 'opened');
    render(
      <InvitationExperience
        theme="modern-xi-club"
        token="single-gallery-demo"
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
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
      window.localStorage.setItem(`np-wedding-envelope-${theme}`, 'opened');
      render(
        <InvitationExperience
          theme={theme}
          token={`legacy-${theme}-token`}
          initialInvitation={DEMO_PUBLIC_INVITATION}
          calendarLinks={{ google: '#google', ics: '#ics' }}
          preview
        />,
      );

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
      window.localStorage.setItem('np-wedding-envelope-modern-xi-club', 'opened');
      render(
        <InvitationExperience
          theme="modern-xi-club"
          token="pending-calendar-demo"
          initialInvitation={{ ...DEMO_PUBLIC_INVITATION, status }}
          calendarLinks={{ google: '#google', ics: '#ics' }}
          preview
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
      expect(screen.queryByText('เพิ่มลงปฏิทินไว้เลย')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Google Calendar' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Apple / Outlook' })).not.toBeInTheDocument();
    },
  );

  it('offers calendar actions after the guest accepts', () => {
    window.localStorage.setItem('np-wedding-envelope-modern-xi-club', 'opened');
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

    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    expect(screen.getByText('เพิ่มลงปฏิทินไว้เลย')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Google Calendar' })).toHaveAttribute('href', '#google');
    expect(screen.getByRole('link', { name: 'Apple / Outlook' })).toHaveAttribute('href', '#ics');
  });

  it('treats an anchor-aligned section as visible for reveal animation', () => {
    const section = document.createElement('section');
    section.getBoundingClientRect = () => ({ top: -1, bottom: 240 } as DOMRect);

    expect(isSectionInViewport(section, 800)).toBe(true);
  });

  it('shows the landing before routing first-time and returning Modern guests to their entry state', () => {
    const storageKey = 'np-wedding-envelope-modern-xi-club';
    window.localStorage.removeItem(storageKey);
    const firstEntryFrame = holdAnimationFrame();
    const firstVisit = render(
      <InvitationExperience
        theme="modern-xi-club"
        token="first-time-demo"
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    expect(screen.getByRole('button', { name: 'Enter to our wedding' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    expect(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' })).toBeInTheDocument();
    firstEntryFrame.flush();
    expect(document.activeElement).toBe(document.getElementById('invitation-envelope-button'));
    firstEntryFrame.restore();

    firstVisit.unmount();
    window.localStorage.setItem(storageKey, 'opened');
    const returningEntryFrame = holdAnimationFrame();
    render(
      <InvitationExperience
        theme="modern-xi-club"
        token="returning-demo"
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
    expect(screen.queryByRole('button', { name: 'เปิดซองคำเชิญ' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Nathapol/i })).toBeInTheDocument();
    returningEntryFrame.flush();
    expect(document.activeElement).toBe(document.getElementById('invitation-detail-heading'));
    returningEntryFrame.restore();
  });

  it('keeps the production Modern entry flow usable when storage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    try {
      render(
        <InvitationExperience
          theme="modern-xi-club"
          token="production-storage-unavailable"
          initialInvitation={DEMO_PUBLIC_INVITATION}
          calendarLinks={{ google: '#google', ics: '#ics' }}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
      expect(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' })).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('persists production envelope state with the invite code and never the bearer token', () => {
    const bearerToken = 'raw-secret-invitation-token';
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
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

    const storageKeys = [...getItem.mock.calls, ...setItem.mock.calls]
      .map(([key]) => String(key));
    expect(storageKeys).toContain(`np-wedding-envelope-${DEMO_PUBLIC_INVITATION.inviteCode}`);
    expect(storageKeys.every((key) => !key.includes(bearerToken))).toBe(true);
  });
});
