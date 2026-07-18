import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeddingGallery } from './wedding-gallery';

describe('WeddingGallery', () => {
  it('renders the four selected portraits as named image buttons', () => {
    render(<WeddingGallery />);

    const triggers = screen.getAllByRole('button', { name: /เปิดภาพ/ });
    expect(triggers).toHaveLength(4);
    expect(triggers.map((trigger) => within(trigger).getByRole('img').getAttribute('src')))
      .toEqual(expect.arrayContaining([
        expect.stringContaining('photo-02.jpg'),
        expect.stringContaining('photo-03.jpg'),
        expect.stringContaining('photo-04.jpg'),
        expect.stringContaining('photo-07.jpg'),
      ]));
  });

  it('opens a named dialog and supports keyboard navigation and Escape', () => {
    render(<WeddingGallery />);

    fireEvent.click(screen.getAllByRole('button', { name: /เปิดภาพ/ })[0]);
    expect(screen.getByRole('dialog', { name: 'ภาพของเรา' })).toHaveTextContent('1 / 4');

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog')).toHaveTextContent('2 / 4');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('wraps previous and next controls around the four portraits', () => {
    render(<WeddingGallery />);

    fireEvent.click(screen.getAllByRole('button', { name: /เปิดภาพ/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'ภาพก่อนหน้า' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('4 / 4');

    fireEvent.click(screen.getByRole('button', { name: 'ภาพถัดไป' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('1 / 4');
  });

  it('wraps Shift+Tab from the first lightbox control to the last control', () => {
    render(<WeddingGallery />);

    const backgroundTriggers = screen.getAllByRole('button', { name: /เปิดภาพ/ });
    fireEvent.click(backgroundTriggers[0]);
    const controls = within(screen.getByRole('dialog', { name: 'ภาพของเรา' }))
      .getAllByRole('button');

    controls[0].focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(controls[controls.length - 1]);
    expect(backgroundTriggers).not.toContain(document.activeElement);
  });

  it('wraps Tab from the last lightbox control to the first control', () => {
    render(<WeddingGallery />);

    const backgroundTriggers = screen.getAllByRole('button', { name: /เปิดภาพ/ });
    fireEvent.click(backgroundTriggers[0]);
    const controls = within(screen.getByRole('dialog', { name: 'ภาพของเรา' }))
      .getAllByRole('button');

    controls[controls.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(controls[0]);
    expect(backgroundTriggers).not.toContain(document.activeElement);
  });

  it('closes only on the backdrop itself and returns focus to the exact trigger', () => {
    render(<WeddingGallery />);

    const trigger = screen.getAllByRole('button', { name: /เปิดภาพ/ })[2];
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'ภาพของเรา' });
    const image = within(dialog).getByRole('img');

    fireEvent.click(image);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const backdrop = dialog.parentElement as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes from its real close button and removes the open keyboard listener', () => {
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const view = render(<WeddingGallery />);

    const trigger = screen.getAllByRole('button', { name: /เปิดภาพ/ })[1];
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'ปิดภาพ' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
    expect(removeEventListener.mock.calls.some(([type]) => type === 'keydown')).toBe(true);

    view.unmount();
    removeEventListener.mockRestore();
  });

  it('isolates the invitation and locks body scroll while the lightbox is open', async () => {
    document.body.style.overflow = 'scroll';
    const view = render(
      <div className="invitation-theme">
        <WeddingGallery />
      </div>,
    );
    const invitation = view.container.querySelector('.invitation-theme') as HTMLElement;

    fireEvent.click(screen.getAllByRole('button', { name: /เปิดภาพ/ })[0]);

    await waitFor(() => {
      expect(invitation).toHaveAttribute('inert');
      expect(document.body.style.overflow).toBe('hidden');
    });
    expect(invitation).not.toContainElement(screen.getByRole('dialog', { name: 'ภาพของเรา' }));

    fireEvent.click(screen.getByRole('button', { name: 'ปิดภาพ' }));

    await waitFor(() => {
      expect(invitation).not.toHaveAttribute('inert');
      expect(document.body.style.overflow).toBe('scroll');
    });
  });

  it('restores exact prior isolation and scroll values when unmounted while open', async () => {
    document.body.style.overflow = 'clip';
    const view = render(
      <div className="invitation-theme">
        <WeddingGallery />
      </div>,
    );
    const invitation = view.container.querySelector('.invitation-theme') as HTMLElement;
    invitation.setAttribute('inert', 'preserved');

    fireEvent.click(screen.getAllByRole('button', { name: /เปิดภาพ/ })[0]);
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));

    view.unmount();

    expect(invitation.getAttribute('inert')).toBe('preserved');
    expect(document.body.style.overflow).toBe('clip');
  });

  it('uses a viewport-aware bounded lightbox image size', () => {
    render(<WeddingGallery />);

    fireEvent.click(screen.getAllByRole('button', { name: /เปิดภาพ/ })[0]);

    expect(within(screen.getByRole('dialog', { name: 'ภาพของเรา' })).getByRole('img'))
      .toHaveAttribute('sizes', '(max-width: 720px) calc(100vw - 44px), 940px');
  });
});
