'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, MapPin, PartyPopper, Pencil, QrCode } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { TIMELINE, WEDDING } from '@/lib/domain/event';
import { PUBLIC_WEDDING_PRESENTATION } from '@/lib/domain/public-invitation';
import type { PublicInvitation } from '@/lib/services/invitation-service';
import { AmbientMusic } from './ambient-music';
import { Countdown } from './countdown';
import { EnvelopeGate } from './envelope';
import { InvitationLanding } from './invitation-landing';
import { RsvpForm } from './rsvp-form';
import { WeddingGallery } from './wedding-gallery';

export type DraftTheme = 'blush-shanghai' | 'tea-to-toast' | 'modern-xi-club';

type PersonalizedInvitationExperienceProps = {
  theme: DraftTheme;
  mode?: 'personalized';
  token: string;
  initialInvitation: PublicInvitation;
  calendarLinks: { google: string; ics: string };
  preview?: boolean;
};

type PublicInvitationExperienceProps = {
  theme: DraftTheme;
  mode: 'public';
};

export type InvitationExperienceProps =
  | PersonalizedInvitationExperienceProps
  | PublicInvitationExperienceProps;

export function isSectionInViewport(section: HTMLElement, viewportHeight: number) {
  const rect = section.getBoundingClientRect();
  return rect.top < viewportHeight * 0.95 && rect.bottom > 0;
}

const themeCopy: Record<DraftTheme, { eyebrow: string; descriptor: string; mark: string }> = {
  'blush-shanghai': {
    eyebrow: 'A modern Chinese celebration',
    descriptor: 'เรียบหรู อบอุ่น และมีตราประทับจีนเล็ก ๆ ซ่อนอยู่ในทุกช่วงเวลา',
    mark: '囍',
  },
  'tea-to-toast': {
    eyebrow: 'From tea ceremony to craft beer',
    descriptor: 'เริ่มต้นด้วยชาอุ่น ๆ และจบคืนด้วยแก้วโปรดของเรา',
    mark: '茶',
  },
  'modern-xi-club': {
    eyebrow: 'One ceremony. One big party.',
    descriptor: 'พิธีการตอนบ่าย แล้วมาเต้นกันยาว ๆ หลังสองทุ่ม',
    mark: '喜',
  },
};

const galleryFeature = {
  src: '/gallery/photo-08.jpg',
  alt: 'ภาพขาวดำของณัฐพลและเพ็ญพิสุทธิ์ถือแหวนแต่งงาน',
};

export function InvitationExperience(props: InvitationExperienceProps) {
  const { theme } = props;
  const isPersonalized = props.mode !== 'public';
  const initialInvitation = isPersonalized
    ? props.initialInvitation
    : PUBLIC_WEDDING_PRESENTATION;
  const token = isPersonalized ? props.token : '';
  const calendarLinks = isPersonalized ? props.calendarLinks : undefined;
  const preview = isPersonalized ? (props.preview ?? false) : false;
  const [invitation, setInvitation] = useState(initialInvitation);
  const [editing, setEditing] = useState(initialInvitation.status === 'pending');
  const [contentMounted, setContentMounted] = useState(initialInvitation.status !== 'pending');
  const [entered, setEntered] = useState(false);
  const focusFrame = useRef<number | null>(null);
  const copy = themeCopy[theme];
  const isModernTheme = theme === 'modern-xi-club';
  const reduceMotion = useReducedMotion();

  function focusInvitationEntryTarget() {
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current);
    focusFrame.current = window.requestAnimationFrame(() => {
      focusFrame.current = null;
      const target = document.getElementById('invitation-envelope-button')
        ?? document.getElementById('invitation-detail-heading');
      target?.focus();
    });
  }

  useEffect(() => () => {
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current);
  }, []);

  useEffect(() => {
    if (preview || !isPersonalized) return;
    try {
      window.localStorage.setItem('np-wedding-invite-code', invitation.inviteCode);
    } catch {
      // The invitation remains usable when browser storage is unavailable.
    }
  }, [invitation.inviteCode, isPersonalized, preview]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.invitation-theme');
    if (!root) return;
    root.classList.add('reveal-enabled');
    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (sections.length === 0) {
      root.classList.remove('reveal-enabled');
      return;
    }
    sections.forEach((section, index) => {
      section.style.setProperty('--reveal-delay', `${Math.min(index * 55, 220)}ms`);
    });
    const revealVisibleSections = () => {
      sections.forEach((section) => {
        if (isSectionInViewport(section, window.innerHeight)) section.classList.add('is-visible');
      });
    };
    revealVisibleSections();
    window.addEventListener('scroll', revealVisibleSections, { passive: true });

    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return () => {
        window.removeEventListener('scroll', revealVisibleSections);
        root.classList.remove('reveal-enabled');
      };
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', revealVisibleSections);
      root.classList.remove('reveal-enabled');
    };
  }, [contentMounted, entered]);

  return (
    <div className="invitation-theme" data-theme={theme}>
      {preview ? <div className="preview-ribbon">CLICKABLE DRAFT · {theme.replaceAll('-', ' ')}</div> : null}
      <div className="invitation-entry-stack">
        <AnimatePresence initial={false}>
          {isModernTheme && !entered ? (
            <InvitationLanding
              key="landing"
              onEnter={() => {
                setEntered(true);
                focusInvitationEntryTarget();
              }}
            />
          ) : (
            <motion.div
              key="invitation-gate"
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
            >
        <EnvelopeGate
          onOpen={() => {
            setContentMounted(true);
            focusInvitationEntryTarget();
          }}
        >
        <AmbientMusic />
        <header className={`hero-section${isModernTheme ? ' detail-hero' : ''}`}>
          <div className="hero-pattern" aria-hidden="true" />
          <p className="eyebrow">{copy.eyebrow}</p>
          <div className="hero-mark" aria-hidden="true">{copy.mark}</div>
          <p className="invited-name">
            {isPersonalized
              ? `เรียนเชิญ ${invitation.displayName}`
              : 'เรียนเชิญร่วมเป็นส่วนหนึ่งในวันของเรา'}
          </p>
          <h1 id="invitation-detail-heading" tabIndex={-1}>
            <span>Nathapol</span>
            <small>&</small>
            <span>Pennisut</span>
          </h1>
          <Image className="brand-name-image" src="/brand/names.png" alt="Nathapol Pennisut" width={988} height={198} priority />
          <p className="thai-names">ณัฐพล & เพ็ญพิสุทธิ์</p>
          <p className="hero-descriptor">{copy.descriptor}</p>
          <div className="date-lockup">
            <span>04</span><i>·</i><span>12</span><i>·</i><span>26</span>
          </div>
          <p className="venue-line">วันศุกร์ · 15:00 น. · Celebce Venue</p>
          <Countdown />
          <a className="scroll-cue" href="#schedule">เลื่อนดูรายละเอียด ↓</a>
        </header>

        {theme === 'modern-xi-club' ? (
          <nav className="quick-nav" aria-label="ทางลัด">
            <a href="#schedule">กำหนดการ</a>
            <a href="#venue">สถานที่</a>
            <a href="#gallery">รูปเรา</a>
            {isPersonalized
              ? <a className="quick-nav-primary" href="#rsvp">ตอบรับ</a>
              : null}
          </nav>
        ) : null}

        <main>
          <section className="content-section intro-card" data-reveal>
            <p className="section-kicker">OUR DAY</p>
            <h2>วันเดียว หลายพิธี<br />และหนึ่งปาร์ตี้ที่อยากมีคุณ</h2>
            <p>มาร่วมใช้เวลาตั้งแต่ขบวนขันหมาก ยกน้ำชา จนถึงแก้วสุดท้ายของ After Party ด้วยกันนะ</p>
          </section>

          <section className="content-section" id="schedule" data-reveal>
            <p className="section-kicker">TIMELINE · 04.12.2026</p>
            <h2>กำหนดการ</h2>
            <div className="timeline-list">
              {TIMELINE.map((item, index) => (
                <article className="timeline-item" key={item.time}>
                  <span className="timeline-index">0{index + 1}</span>
                  <span className="timeline-symbol">{item.icon}</span>
                  <div><time>{item.time}</time><h3>{item.title}</h3></div>
                </article>
              ))}
            </div>
          </section>

          <section className="content-section venue-section" id="venue" data-reveal>
            <div className="map-art" aria-hidden="true"><MapPin size={42} /><span>CELEBCE</span></div>
            <div>
              <p className="section-kicker">LOCATION</p>
              <h2>{WEDDING.venue}</h2>
              <p>{WEDDING.address}</p>
              <a className="secondary-button" href={WEDDING.mapUrl} target="_blank" rel="noreferrer"><MapPin size={17} /> เปิดแผนที่และนำทาง</a>
            </div>
          </section>

          {isModernTheme ? (
            <section className="content-section wedding-colors-section" data-reveal>
              <p className="section-kicker">PALETTE</p>
              <h2>Wedding Colors</h2>
              <ul className="wedding-color-list">
                <li><span className="wedding-color-swatch chocolate-brown" aria-hidden="true" /><span>Chocolate Brown</span></li>
                <li><span className="wedding-color-swatch mocha" aria-hidden="true" /><span>Mocha</span></li>
                <li><span className="wedding-color-swatch dusty-pink" aria-hidden="true" /><span>Dusty Pink</span></li>
                <li><span className="wedding-color-swatch blush-pink" aria-hidden="true" /><span>Blush Pink</span></li>
              </ul>
            </section>
          ) : null}

          <section className="content-section gallery-section" id="gallery" data-reveal>
            <p className="section-kicker">A LITTLE PREVIEW</p>
            <h2>ก่อนเราจะเจอกัน</h2>
            {isModernTheme ? (
              <WeddingGallery />
            ) : (
              <div className="gallery-grid">
                <figure className="gallery-feature">
                  <Image
                    src={galleryFeature.src}
                    alt={galleryFeature.alt}
                    width={1800}
                    height={1200}
                    sizes="(max-width: 720px) calc(100vw - 36px), 1080px"
                    loading="lazy"
                  />
                </figure>
              </div>
            )}
          </section>

          {isPersonalized ? <section className="content-section rsvp-section" id="rsvp" data-reveal>
            <p className="section-kicker">RSVP · ภายใน 27 พฤศจิกายน 2569</p>
            <h2>แล้วเจอกันไหม?</h2>
            {invitation.status !== 'pending' && !editing ? (
              <div className="rsvp-summary">
                <PartyPopper size={34} />
                <h3>{invitation.status === 'accepted' ? 'ดีใจที่จะได้เจอกัน!' : 'เราเก็บคำตอบไว้แล้ว'}</h3>
                <p>
                  สถานะ: {invitation.status === 'accepted' ? `มาร่วม ${invitation.adultCount + invitation.childCount} คน` : invitation.status === 'maybe' ? 'ยังไม่แน่ใจ' : 'ไม่สะดวกมาร่วม'}
                </p>
                {invitation.tableNumbers.length > 0 ? <p className="table-badge">โต๊ะ {invitation.tableNumbers.join(', ')}</p> : null}
                {invitation.status === 'accepted' && calendarLinks ? (
                  <div className="accepted-calendar">
                    <CalendarDays size={28} />
                    <div>
                      <p className="section-kicker">SAVE THE DATE</p>
                      <h4>เพิ่มลงปฏิทินไว้เลย</h4>
                    </div>
                    <div className="calendar-actions">
                      <a className="secondary-button" href={calendarLinks.google} target="_blank" rel="noreferrer">Google Calendar</a>
                      <a className="secondary-button" href={calendarLinks.ics}>Apple / Outlook</a>
                    </div>
                  </div>
                ) : null}
                <button className="text-button" type="button" onClick={() => setEditing(true)}><Pencil size={16} /> แก้ไขคำตอบ</button>
              </div>
            ) : (
              <RsvpForm
                token={token}
                initial={invitation}
                onSaved={(saved) => { setInvitation(saved); setEditing(false); }}
              />
            )}
          </section> : null}

          {isPersonalized ? <section className="content-section checkin-teaser" data-reveal>
            <QrCode size={28} />
            <div><h2>วันงานเช็กอินเองได้</h2><p>สแกน QR กลางที่หน้างาน แล้วใช้รหัสเชิญ <strong>{invitation.inviteCode}</strong></p></div>
          </section> : null}
        </main>

        <footer className="wedding-footer"><span className="footer-monogram">NP</span><p>แล้วพบกันวันที่ 4 ธันวาคม 2569</p></footer>
        </EnvelopeGate>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
