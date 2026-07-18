'use client';

import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function EnvelopeGate({
  children,
  onOpen,
}: {
  children: ReactNode;
  onOpen?: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const reduceMotion = useReducedMotion();

  function openEnvelope() {
    onOpen?.();
    setOpened(true);
  }

  if (opened) {
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
