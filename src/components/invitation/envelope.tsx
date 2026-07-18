'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const subscribeToStoredEnvelope = () => () => undefined;

function wasEnvelopeOpened(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) === 'opened';
  } catch {
    return false;
  }
}

function storeOpenedEnvelope(storageKey: string) {
  try {
    window.localStorage.setItem(storageKey, 'opened');
  } catch {
    // The current session can still continue without persisted storage.
  }
}

export function EnvelopeGate({
  children,
  storageKey,
  defaultOpen = false,
  onOpen,
}: {
  children: ReactNode;
  storageKey: string;
  defaultOpen?: boolean;
  onOpen?: () => void;
}) {
  const [opened, setOpened] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();
  const wasOpenedBefore = useSyncExternalStore(
    subscribeToStoredEnvelope,
    () => wasEnvelopeOpened(storageKey),
    () => false,
  );

  function openEnvelope() {
    storeOpenedEnvelope(storageKey);
    onOpen?.();
    setOpened(true);
  }

  if (opened || wasOpenedBefore) {
    return (
      <motion.div
        initial={{ opacity: reduceMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <main className="envelope-stage">
      <div className="floating-cloud cloud-one" aria-hidden="true" />
      <div className="floating-cloud cloud-two" aria-hidden="true" />
      <motion.button
        id="invitation-envelope-button"
        className="envelope-button"
        type="button"
        aria-label="เปิดซองคำเชิญ"
        onClick={openEnvelope}
        whileHover={reduceMotion ? undefined : { y: -6, rotate: -0.5 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      >
        <span className="envelope-flap" aria-hidden="true" />
        <span className="envelope-copy">คำเชิญสำหรับคุณ</span>
        <span className="wax-seal" aria-hidden="true">NP</span>
        <span className="tap-note">แตะเพื่อเปิดซอง</span>
      </motion.button>
    </main>
  );
}
