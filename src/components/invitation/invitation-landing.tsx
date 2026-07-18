'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

export function InvitationLanding({ onEnter }: { onEnter: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.main
      className="invitation-landing"
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
    >
      <Image
        aria-hidden
        className="invitation-landing-backdrop"
        src="/gallery/photo-08.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <Image
        className="invitation-landing-portrait"
        src="/gallery/photo-08.jpg"
        alt="ณัฐพลและเพ็ญพิสุทธิ์ถือแหวนแต่งงาน"
        width={1800}
        height={1200}
        priority
        sizes="100vw"
      />
      <div className="invitation-landing-shade" aria-hidden="true" />
      <div className="invitation-landing-copy">
        <p>NATHAPOL & PENNISUT</p>
        <h1>04 · 12 · 2026</h1>
        <button type="button" onClick={onEnter}>Enter to our wedding</button>
      </div>
    </motion.main>
  );
}
