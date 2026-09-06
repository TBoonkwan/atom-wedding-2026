'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Heart, X } from 'lucide-react';
import styles from './rsvp-sheet.module.css';

function Modal({ open, onClose, title, returnFocus, sheet = false, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  returnFocus: RefObject<HTMLButtonElement | null>;
  sheet?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTarget = returnFocus.current ?? previousFocus;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      focusTarget?.focus({ preventScroll: true });
    };
  }, [open, returnFocus]);

  return (
    <dialog ref={ref} className={sheet ? styles.sheet : styles.thanks} aria-label={title}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={styles.content}>
        {sheet ? <><div className={styles.handle} aria-hidden="true" /><button type="button" className={styles.close} aria-label="ปิดแบบตอบรับ" onClick={onClose}><X size={22} /></button><h2>{title}</h2><p className={styles.deadline}>กรุณาตอบกลับภายใน <time dateTime="2026-11-27">27.11.2026</time></p></> : null}
        {children}
      </div>
    </dialog>
  );
}

export function RsvpSheet({ endRef, children }: {
  endRef: RefObject<HTMLDivElement | null>;
  children: (onComplete: () => void) => ReactNode;
}) {
  const [view, setView] = useState<'form' | 'thanks' | null>(null);
  const prompted = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const end = endRef.current;
    if (!end || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (prompted.current || !entries.some(entry => entry.isIntersecting)) return;
      prompted.current = true;
      setView('form');
      observer.disconnect();
    }, { threshold: 1 });
    observer.observe(end);
    return () => observer.disconnect();
  }, [endRef]);

  function close() {
    setView(null);
  }

  return (
    <>
      <button ref={trigger} type="button" className="primary-button" onClick={() => { prompted.current = true; setView('form'); }}>ตอบรับคำเชิญ</button>
      <Modal returnFocus={trigger} open={view === 'form'} onClose={close} title="ตอบรับคำเชิญ" sheet>
        {children(() => setView('thanks'))}
      </Modal>
      <Modal returnFocus={trigger} open={view === 'thanks'} onClose={close} title="ขอบคุณที่ตอบกลับ">
        <Heart size={36} aria-hidden="true" />
        <h2>ขอบคุณที่ตอบกลับ</h2>
        <p>บันทึกคำตอบของคุณเรียบร้อยแล้ว 💗</p>
        <button type="button" className="primary-button" onClick={close}>ปิด</button>
      </Modal>
    </>
  );
}
