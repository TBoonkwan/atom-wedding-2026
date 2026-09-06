'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Heart,
  PartyPopper,
  Pencil,
  QrCode,
} from 'lucide-react';
import { WEDDING } from '@/lib/domain/event';
import type { PublicInvitation } from '@/lib/services/invitation-service';
import { WeddingGallery } from './wedding-gallery';
import { Countdown } from './countdown';
import { RsvpForm } from './rsvp-form';
import styles from './canva-wedding.module.css';

type CanvaWeddingExperienceProps =
  | {
      mode: 'public';
      calendarLink: string;
    }
  | {
      mode: 'personalized';
      token: string;
      initialInvitation: PublicInvitation;
      calendarLinks: { google: string; ics: string };
    };

const media = '/canva-wedding/media';
const photos = '/canva-wedding/photos';

const portraitGallery = [
  { src: `${photos}/red-formal-portrait.webp`, alt: 'คู่บ่าวสาวในชุดราตรีสีแดงและชุดสูทสีดำ', width: 1200, height: 1800 },
  { src: `${photos}/canva-black-window.webp`, alt: 'คู่บ่าวสาวชุดดำริมหน้าต่างตามต้นฉบับ Canva', width: 1200, height: 1800 },
  { src: `${photos}/canva-white-standing.webp`, alt: 'คู่บ่าวสาวชุดแต่งงานสีขาวยืนมองกัน', width: 961, height: 1599 },
  { src: `${photos}/canva-black-embrace.webp`, alt: 'คู่บ่าวสาวชุดดำโอบกอดกัน', width: 1066, height: 1599 },
  { src: `${photos}/canva-white-bouquet.webp`, alt: 'เจ้าสาวถือช่อดอกไม้และซบไหล่เจ้าบ่าว', width: 1200, height: 1800 },
  { src: `${photos}/canva-red-embrace.webp`, alt: 'คู่บ่าวสาวชุดราตรีสีแดงโอบกอดกันตามต้นฉบับ Canva', width: 1066, height: 1599 },
] as const;

const editorialGallery = [
  { src: `${photos}/red-seated-portrait.webp`, alt: 'คู่บ่าวสาวในภาพพอร์ตเทรตนั่งโทนแดง', width: 1200, height: 1800 },
  { src: `${photos}/red-chair-embrace.webp`, alt: 'คู่บ่าวสาวโอบกอดกันบนเก้าอี้สีแดง', width: 1200, height: 1800 },
  { src: `${photos}/garden-wedding.webp`, alt: 'คู่บ่าวสาวในสวนกับชุดแต่งงานสีขาว', width: 1800, height: 1200, wide: true },
  { src: `${photos}/black-editorial.webp`, alt: 'ภาพคู่บ่าวสาวโทนดำแบบบรรณาธิการ', width: 1800, height: 1200, wide: true },
  { src: `${photos}/rings-closeup.webp`, alt: 'ภาพขาวดำระยะใกล้ของคู่บ่าวสาวและแหวน', width: 1241, height: 1800, wide: true },
  { src: `${photos}/studio-seated.webp`, alt: 'คู่บ่าวสาวนั่งถ่ายภาพในสตูดิโอ', width: 1182, height: 1774 },
  { src: `${photos}/red-lamp-portrait-alt.webp`, alt: 'ภาพพอร์ตเทรตคู่บ่าวสาวชุดสีแดงใต้แสงโคมไฟ', width: 1200, height: 1800 },
  { src: `${photos}/red-carpet.webp`, alt: 'คู่บ่าวสาวบนพรมลายกับชุดราตรีสีแดง', width: 1800, height: 1201, wide: true },
  { src: `${photos}/white-camera.webp`, alt: 'เจ้าบ่าวถ่ายภาพเจ้าสาวที่ยื่นช่อดอกไม้', width: 1200, height: 1800 },
  { src: `${photos}/white-kiss.webp`, alt: 'คู่บ่าวสาวจูบกันหลังช่อดอกไม้', width: 1200, height: 1800 },
] as const;

export function CanvaWeddingExperience(props: CanvaWeddingExperienceProps) {
  const personalized = props.mode === 'personalized';
  const [invitation, setInvitation] = useState<PublicInvitation | null>(
    personalized ? props.initialInvitation : null,
  );
  const [editing, setEditing] = useState(
    personalized ? props.initialInvitation.status === 'pending' : false,
  );
  const galleryRoot = useRef<HTMLDivElement>(null);
  const calendarHref = personalized ? props.calendarLinks.google : props.calendarLink;

  useEffect(() => {
    if (!personalized || !invitation?.inviteCode) return;
    try {
      window.localStorage.setItem('np-wedding-invite-code', invitation.inviteCode);
    } catch {
      // The invitation remains usable when browser storage is unavailable.
    }
  }, [invitation?.inviteCode, personalized]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      let textOrder = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (entry.target instanceof HTMLElement && entry.target.hasAttribute('data-text-reveal')) {
          entry.target.style.setProperty('--text-delay', `${80 + (textOrder % 4) * 110}ms`);
          textOrder += 1;
        }
        entry.target.setAttribute('data-scroll-revealed', '');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });

    galleryRoot.current?.querySelectorAll('[data-photo-reveal], [data-section-reveal], [data-text-reveal]').forEach(photo => observer.observe(photo));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.viewport} data-gallery-root ref={galleryRoot}>
      <main className={styles.invitation}>
        <section className={styles.hero} aria-labelledby="wedding-couple">
          <Image
            className={styles.heroPhoto}
            src={`${photos}/hero.webp`}
            alt="ณัฐพลและเพ็ญพิสุทธิ์"
            width={1080}
            height={1531}
            sizes="(max-width: 1366px) 100vw, 1366px"
            preload
          />
          <div className={styles.heroFade} aria-hidden="true" />
        </section>

        <section data-section-reveal className={styles.namesBlock}>
          {personalized && invitation ? (
            <p data-text-reveal className={styles.invitedName}>เรียนเชิญ {invitation.displayName}</p>
          ) : (
            <p data-text-reveal className={styles.invitedName}>ขอเรียนเชิญร่วมเป็นเกียรติในวันของเรา</p>
          )}
          <h1 data-text-reveal id="wedding-couple">Nathapol &amp; Pennisut</h1>
          <p data-text-reveal className={styles.tagline}>let&apos;s it be me · with lovely</p>

        </section>

        <section data-section-reveal className={styles.countdownSection}>
          <a data-text-reveal className={styles.dateLink} href={calendarHref} target="_blank" rel="noreferrer">save the date · 04.12.2026</a>
          <Countdown />
        </section>

        <WeddingGallery images={portraitGallery} renderGallery={open => (
        <section data-section-reveal className={styles.portraitGrid} aria-label="ภาพพรีเวดดิ้ง">
          {portraitGallery.map((photo, index) => (
            <figure data-photo-reveal key={photo.src}>
              <button type="button" className={styles.photoButton} aria-label={`เปิดภาพ: ${photo.alt}`} onClick={e => open(index, e.currentTarget)}>
              <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 1366px) 33vw, 440px" loading={index < 3 ? 'eager' : 'lazy'} unoptimized={index === 0} />
              </button>
            </figure>
          ))}
        </section>
        )} />

        <section data-section-reveal className={styles.timelineSection} aria-labelledby="timeline-heading">
          <p data-text-reveal className={styles.scriptLabel}>timing of the day</p>
          <h2 id="timeline-heading">timing of the day</h2>
          <p data-text-reveal className={styles.dateCaption}>2026.12.04</p>
          <Image
            className={styles.sectionArtwork}
            src={`${media}/timing.png`}
            alt="กำหนดการ: แห่ขันหมาก 15.09 น. สู่ขอหมั้น 15.39 น. ยกน้ำชา 16.09 น. รดน้ำสังข์ 16.39 น. ส่งตัว 17.09 น. รับประทานอาหาร 18.30 น."
            width={6517}
            height={1504}
            sizes="(max-width: 1366px) 100vw, 1366px"
          />
        </section>

        <section data-section-reveal className={styles.locationSection} aria-labelledby="location-heading">
          <div className={styles.locationText}>
            <h2 data-text-reveal id="location-heading">location</h2>
            <p data-text-reveal>are delighted to invite you to their wedding</p>
            <p data-text-reveal>friday 4<sup>th</sup> december 2026 at <strong>celebce venue bangkok</strong></p>
            <p data-text-reveal><time dateTime="2026-12-04T15:00:00+07:00">15.00 น.</time></p>
          </div>
          <div className={styles.venueCard}>
            <Image className={styles.venuePhoto} src={`${media}/ee63bec71ca1611e34458fe6ad4ccd71.png`} alt="Celebce Venue" width={1685} height={1839} sizes="(max-width: 720px) 100vw, 1000px" />
            <a className={styles.qrLink} href={WEDDING.mapUrl} target="_blank" rel="noreferrer" aria-label={`เปิดแผนที่ ${WEDDING.venue}`}>
              <Image className={styles.qrArt} src={`${media}/6293e1428f15322db19dd1dd22b91950.png`} alt="คิวอาร์โค้ดแผนที่ Celebce Venue" width={771} height={790} sizes="180px" />
            </a>
          </div>
        </section>

        <section data-section-reveal className={styles.dressSection} aria-labelledby="dress-heading">
          <div className={styles.dressCard}>
            <h2 id="dress-heading" className={styles.srOnly}>dress code theme</h2>
            <div className={styles.srOnly}>
              <p data-text-reveal>strictly formal</p>
              <p data-text-reveal>กรุณาแต่งกายด้วยชุดสุภาพในโทนสีน้ำตาลและเบจ</p>
              <ul>
                <li>deep mocha</li>
                <li>taupe brown</li>
                <li>caramel tone</li>
                <li>warm beige</li>
                <li>soft ivory</li>
              </ul>
            </div>
            <Image
              className={styles.dressArtwork}
              src={`${photos}/dress-code.webp`}
              alt="แนวทางการแต่งกายแบบสุภาพในโทนสีน้ำตาลและเบจ"
              width={2276}
              height={3171}
              sizes="(max-width: 720px) 100vw, 1000px"
            />
          </div>
        </section>

        <WeddingGallery images={editorialGallery} renderGallery={open => (
        <section data-section-reveal className={styles.editorialSection} aria-label="ภาพความทรงจำของคู่บ่าวสาว">
          <div className={styles.editorialGrid}>
            {editorialGallery.map((photo, index) => (
              <figure data-photo-reveal key={photo.src} className={'wide' in photo && photo.wide ? styles.widePhoto : undefined}>
                <button type="button" className={styles.photoButton} aria-label={`เปิดภาพ: ${photo.alt}`} onClick={e => open(index, e.currentTarget)}>
                <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes={('wide' in photo && photo.wide) ? '(max-width: 720px) 100vw, 1366px' : '(max-width: 720px) 50vw, 650px'} />
                </button>
              </figure>
            ))}
          </div>
        </section>

        )} />

        <section data-section-reveal className={styles.rsvpSection} id="rsvp" aria-label="ตอบรับคำเชิญ">
          <div className={styles.rsvpBackdrop} aria-hidden="true">
            <Image src={`${photos}/rings-silhouette.webp`} alt="" width={1081} height={952} sizes="(max-width: 720px) 100vw, 1366px" />
          </div>
          <div className={styles.rsvpContent}>
            <p data-text-reveal className={styles.rsvpTitle}>RSVP</p>
            <p data-text-reveal className={styles.rsvpDeadline}>kindly reply by<br /><time dateTime="2026-11-27">27.11.2026</time></p>
            {personalized && invitation ? (
              <>
                {invitation.status !== 'pending' && !editing ? (
                  <div className="rsvp-summary">
                    <PartyPopper size={34} />
                    <h3>{invitation.status === 'accepted' ? 'ดีใจที่จะได้เจอกัน!' : 'เราเก็บคำตอบไว้แล้ว'}</h3>
                    <p data-text-reveal>{invitation.status === 'accepted' ? `มาร่วมงาน ${invitation.adultCount + invitation.childCount} คน` : invitation.status === 'maybe' ? 'ยังไม่แน่ใจ' : 'ไม่สะดวกมาร่วม'}</p>
                    {invitation.tableNumbers.length > 0 ? <p data-text-reveal className={styles.tableBadge}>โต๊ะ {invitation.tableNumbers.join(', ')}</p> : null}
                    {invitation.status === 'accepted' ? (
                      <div className="accepted-calendar">
                        <CalendarDays size={28} />
                        <div><p data-text-reveal>save the date</p><h4>เพิ่มลงปฏิทินไว้เลย</h4></div>
                        <div className="calendar-actions">
                          <a className="secondary-button" href={props.calendarLinks.google} target="_blank" rel="noreferrer">Google Calendar</a>
                          <a className="secondary-button" href={props.calendarLinks.ics}>Apple / Outlook</a>
                        </div>
                      </div>
                    ) : null}
                    <button className="text-button" type="button" onClick={() => setEditing(true)}><Pencil size={16} /> แก้ไขคำตอบ</button>
                  </div>
                ) : (
                  <RsvpForm token={props.token} initial={invitation} onSaved={(saved) => { setInvitation(saved); setEditing(false); }} />
                )}
                <aside className={styles.checkinNote}>
                  <QrCode aria-hidden="true" />
                  <p data-text-reveal>วันงานใช้ <strong>รหัสเชิญ {invitation.inviteCode}</strong> เพื่อเช็กอินด้วยตัวเอง</p>
                </aside>
              </>
            ) : (
              <div className={styles.publicRsvp}>
                <Heart aria-hidden="true" />
                <p data-text-reveal>กรุณาเปิดลิงก์คำเชิญส่วนตัวเพื่อส่งคำตอบ</p>
                <small>ลิงก์ส่วนตัวช่วยให้เราจัดที่นั่งและดูแลแขกทุกคนได้อย่างพอดี</small>
              </div>
            )}
          </div>
        </section>

        <footer className={styles.footer}><p data-text-reveal>ณัฐพล &amp; เพ็ญพิสุทธิ์</p><span>04 · 12 · 2026</span></footer>
      </main>
    </div>
  );
}
