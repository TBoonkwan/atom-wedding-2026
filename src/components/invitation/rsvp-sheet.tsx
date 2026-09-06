'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Heart, X } from 'lucide-react';
import styles from './rsvp-sheet.module.css';

function Modal({ open, onClose, title, sheet = false, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  sheet?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open]);

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

export function RsvpSheet({ targetRef, enabled, children }: {
  targetRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  children: (onComplete: () => void) => ReactNode;
}) {
  const [view, setView] = useState<'form' | 'thanks' | null>(null);
  const [completed, setCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const wasEnabled = useRef(enabled);

  useEffect(() => {
    if (enabled && !wasEnabled.current) {
      setCompleted(false);
      setDismissed(false);
    }
    wasEnabled.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const target = targetRef.current;
    if (!enabled || !target || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (completed || !entries.some(entry => entry.isIntersecting)) return;
      setView(current => current ?? 'form');
    }, { threshold: 0.35 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [completed, enabled, targetRef]);

  function close() {
    if (view === 'form') setDismissed(true);
    setView(null);
  }

  function openForm() {
    setDismissed(false);
    setView('form');
  }

  const complete = useCallback(() => {
    setCompleted(true);
    setView('thanks');
  }, []);

  return (
    <>
      {enabled && dismissed && !completed && view === null ? (
        <button type="button" className="primary-button" onClick={openForm}>ตอบรับคำเชิญ</button>
      ) : null}
      <Modal open={view === 'form'} onClose={close} title="ตอบรับคำเชิญ" sheet>
        {children(complete)}
      </Modal>
      <Modal open={view === 'thanks'} onClose={close} title="ขอบคุณที่ตอบกลับ">
        <Heart size={36} aria-hidden="true" />
        <h2>ขอบคุณที่ตอบกลับ</h2>
        <p>บันทึกคำตอบของคุณเรียบร้อยแล้ว 💗</p>
        <button type="button" className="primary-button" onClick={close}>ปิด</button>
      </Modal>
    </>
  );
}
