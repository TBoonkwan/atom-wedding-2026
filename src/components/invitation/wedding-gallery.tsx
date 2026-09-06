'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const galleryImages = [
  {
    src: '/gallery/photo-02.jpg',
    alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดสีดำยืนใกล้กัน',
  },
  {
    src: '/gallery/photo-03.jpg',
    alt: 'ภาพสตูดิโอของณัฐพลและเพ็ญพิสุทธิ์',
  },
  {
    src: '/gallery/photo-04.jpg',
    alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานจีนสีแดง',
  },
  {
    src: '/gallery/photo-07.jpg',
    alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานสีขาว',
  },
] as const;

type GalleryImage = { src: string; alt: string; width?: number; height?: number };
type WeddingGalleryProps = {
  images?: readonly GalleryImage[];
  renderGallery?: (open: (index: number, trigger: HTMLButtonElement) => void) => ReactNode;
};

export function WeddingGallery({ images = galleryImages, renderGallery }: WeddingGalleryProps = {}) {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [openingButton, setOpeningButton] = useState<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const dialog = useRef<HTMLDivElement | null>(null);
  const reel = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);
  const isOpen = activeIndex !== null;

  const openGallery = useCallback((index: number, trigger: HTMLButtonElement) => {
    setOpeningButton(trigger);
    setActiveIndex(index);
  }, []);

  const closeGallery = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const move = useCallback((direction: number) => {
    setActiveIndex((current) => (
      current === null
        ? null
        : (current + direction + images.length) % images.length
    ));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpen.current) {
        wasOpen.current = false;
        openingButton?.focus();
      }
      return;
    }
    wasOpen.current = true;
    closeButton.current?.focus();
  }, [isOpen, openingButton]);

  useEffect(() => {
    if (!isOpen) return;

    const invitationRoot = reel.current?.closest<HTMLElement>('.invitation-theme, [data-gallery-root]') ?? null;
    const previousInert = invitationRoot?.getAttribute('inert') ?? null;
    const previousOverflow = document.body.style.overflow;
    invitationRoot?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';

    return () => {
      if (invitationRoot) {
        if (previousInert === null) invitationRoot.removeAttribute('inert');
        else invitationRoot.setAttribute('inert', previousInert);
      }
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeGallery();
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'Tab') {
        const controls = Array.from(
          dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
        );
        const firstControl = controls[0];
        const lastControl = controls[controls.length - 1];
        if (!firstControl || !lastControl) return;

        const focusIsOutside = !dialog.current?.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === firstControl || focusIsOutside)) {
          event.preventDefault();
          lastControl.focus();
        } else if (!event.shiftKey && (document.activeElement === lastControl || focusIsOutside)) {
          event.preventDefault();
          firstControl.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeGallery, isOpen, move]);

  const activeImage = activeIndex === null ? null : images[activeIndex];

  return (
    <>
      <div className={renderGallery ? undefined : 'gallery-reel'} ref={reel}>
        {renderGallery ? renderGallery(openGallery) : images.map((image, index) => (
          <button
            className="gallery-card"
            type="button"
            key={image.src}
            aria-label={`เปิดภาพ ${index + 1}: ${image.alt}`}
            onClick={(event) => {
              setOpeningButton(event.currentTarget);
              setActiveIndex(index);
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={1200}
              height={1800}
              sizes="(max-width: 540px) 78vw, (max-width: 1080px) 38vw, 310px"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {activeImage && activeIndex !== null ? createPortal((
        <div
          className="gallery-lightbox-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeGallery();
          }}
        >
          <div
            className="gallery-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="ภาพของเรา"
            ref={dialog}
          >
            <button
              className="gallery-lightbox-close"
              type="button"
              aria-label="ปิดภาพ"
              ref={closeButton}
              onClick={closeGallery}
            >
              <X aria-hidden="true" />
            </button>
            <button
              className="gallery-lightbox-control gallery-lightbox-previous"
              type="button"
              aria-label="ภาพก่อนหน้า"
              onClick={() => move(-1)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <figure className="gallery-lightbox-figure"
              onTouchStart={event => {
                const touch = event.touches.length === 1 ? event.touches[0] : null;
                swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
              }}
              onTouchCancel={() => { swipeStart.current = null; }}
              onTouchEnd={event => {
                const start = swipeStart.current;
                swipeStart.current = null;
                const end = event.changedTouches[0];
                if (!start || !end) return;
                const dx = end.clientX - start.x;
                const dy = end.clientY - start.y;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
              }}
            >
              <Image
                key={activeImage.src}
                className="gallery-lightbox-image"
                src={activeImage.src}
                alt={activeImage.alt}
                width={activeImage.width ?? 1200}
                height={activeImage.height ?? 1800}
                unoptimized={activeImage.src.endsWith('.webp')}
                sizes="(max-width: 720px) calc(100vw - 44px), 940px"
              />
            </figure>
            <button
              className="gallery-lightbox-control gallery-lightbox-next"
              type="button"
              aria-label="ภาพถัดไป"
              onClick={() => move(1)}
            >
              <ArrowRight aria-hidden="true" />
            </button>
            <p className="gallery-lightbox-count" aria-live="polite">
              {activeIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      ), document.body) : null}
    </>
  );
}
