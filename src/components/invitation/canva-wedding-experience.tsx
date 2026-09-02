'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Camera,
  Check,
  Coffee,
  GlassWater,
  Heart,
  PartyPopper,
  Pencil,
  Play,
  QrCode,
  Wine,
} from 'lucide-react';
import { TIMELINE, WEDDING } from '@/lib/domain/event';
import type { PublicInvitation } from '@/lib/services/invitation-service';
import { AmbientMusic, type AmbientMusicHandle } from './ambient-music';
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
  { src: `${photos}/black-editorial.webp`, alt: 'ภาพคู่บ่าวสาวโทนดำแบบบรรณาธิการ', width: 1800, height: 1200 },
  { src: `${photos}/studio-seated.webp`, alt: 'คู่บ่าวสาวนั่งถ่ายภาพในสตูดิโอ', width: 1182, height: 1774 },
  { src: `${photos}/red-formal-portrait.webp`, alt: 'คู่บ่าวสาวในชุดราตรีสีแดงและชุดสูทสีดำ', width: 1200, height: 1800 },
  { src: `${photos}/red-black-studio.webp`, alt: 'คู่บ่าวสาวในสตูดิโอสีดำและชุดราตรีสีแดง', width: 1200, height: 1800 },
  { src: `${photos}/red-seated-portrait.webp`, alt: 'คู่บ่าวสาวในภาพพอร์ตเทรตนั่งโทนแดง', width: 1200, height: 1800 },
  { src: `${photos}/red-solo-portrait.webp`, alt: 'เจ้าสาวในชุดราตรีสีแดง', width: 1176, height: 1762 },
] as const;

const editorialGallery = [
  { src: `${photos}/rings-closeup.webp`, alt: 'ภาพขาวดำระยะใกล้ของคู่บ่าวสาวและแหวน', width: 1241, height: 1800 },
  { src: `${photos}/red-lamp-portrait.webp`, alt: 'คู่บ่าวสาวในชุดราตรีสีแดงกับโคมไฟ', width: 1200, height: 1800 },
  { src: `${photos}/red-lamp-portrait-alt.webp`, alt: 'ภาพพอร์ตเทรตคู่บ่าวสาวชุดสีแดงใต้แสงโคมไฟ', width: 1200, height: 1800 },
  { src: `${photos}/red-chair-embrace.webp`, alt: 'คู่บ่าวสาวโอบกอดกันบนเก้าอี้สีแดง', width: 1200, height: 1800 },
  { src: `${photos}/red-carpet.webp`, alt: 'คู่บ่าวสาวบนพรมลายกับชุดราตรีสีแดง', width: 1800, height: 1201, wide: true },
  { src: `${photos}/garden-wedding.webp`, alt: 'คู่บ่าวสาวในสวนกับชุดแต่งงานสีขาว', width: 1800, height: 1200, wide: true },
  { src: `${photos}/rings-silhouette.webp`, alt: 'เงาคู่บ่าวสาวชูแหวนในบรรยากาศสีดำ', width: 1081, height: 952, wide: true },
] as const;

const timelineIcons = [Coffee, Heart, GlassWater, Camera, Wine] as const;

export function CanvaWeddingExperience(props: CanvaWeddingExperienceProps) {
  const personalized = props.mode === 'personalized';
  const [invitation, setInvitation] = useState<PublicInvitation | null>(
    personalized ? props.initialInvitation : null,
  );
  const [editing, setEditing] = useState(
    personalized ? props.initialInvitation.status === 'pending' : false,
  );
  const musicRef = useRef<AmbientMusicHandle>(null);
  const calendarHref = personalized ? props.calendarLinks.google : props.calendarLink;

  useEffect(() => {
    if (!personalized || !invitation?.inviteCode) return;
    try {
      window.localStorage.setItem('np-wedding-invite-code', invitation.inviteCode);
    } catch {
      // The invitation remains usable when browser storage is unavailable.
    }
  }, [invitation?.inviteCode, personalized]);

  return (
    <div className={styles.viewport}>
      <AmbientMusic ref={musicRef} />
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

        <section className={styles.namesBlock}>
          {personalized && invitation ? (
            <p className={styles.invitedName}>เรียนเชิญ {invitation.displayName}</p>
          ) : (
            <p className={styles.invitedName}>ขอเรียนเชิญร่วมเป็นเกียรติในวันของเรา</p>
          )}
          <h1 id="wedding-couple">Nathapol &amp; Pennisut</h1>
          <p className={styles.tagline}>let&apos;s it be me · with lovely</p>
          <div className={styles.musicRow}>
            <span>♡</span>
            <button type="button" className={styles.playButton} onClick={() => musicRef.current?.start()} aria-label="เปิดเพลงคลอ">
              <Play size={22} fill="currentColor" />
            </button>
            <span>♡</span>
          </div>
        </section>

        <section className={styles.countdownSection}>
          <a className={styles.dateLink} href={calendarHref} target="_blank" rel="noreferrer">save the date · 04.12.2026</a>
          <Countdown />
        </section>

        <section className={styles.portraitGrid} aria-label="ภาพพรีเวดดิ้ง">
          {portraitGallery.map((photo) => (
            <figure key={photo.src}>
              <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 720px) 33vw, 420px" />
            </figure>
          ))}
        </section>

        <section className={styles.timelineSection} aria-labelledby="timeline-heading">
          <p className={styles.scriptLabel}>timing of the day</p>
          <h2 id="timeline-heading">timing of the day</h2>
          <p className={styles.dateCaption}>2026.12.04</p>
          <ol className={styles.timeline}>
            {TIMELINE.map((item, index) => {
              const Icon = timelineIcons[index] ?? Check;
              return (
                <li key={item.time}>
                  <span className={styles.timelineIcon}><Icon aria-hidden="true" /></span>
                  <time>{item.time}</time>
                  <span>{item.title}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={styles.locationSection} aria-labelledby="location-heading">
          <div className={styles.sectionHeading}>
            <h2 id="location-heading">location</h2>
            <p>ยินดีต้อนรับทุกคนมาร่วมเป็นส่วนหนึ่งในวันแต่งงานของเรา</p>
            <strong>friday 4<sup>th</sup> december 2026 at celebce venue bangkok</strong>
            <time>15.00 p.m.</time>
          </div>
          <div className={styles.venueCard}>
            <Image className={styles.venuePhoto} src={`${media}/ee63bec71ca1611e34458fe6ad4ccd71.png`} alt="Celebce Venue" width={1685} height={1839} sizes="(max-width: 720px) 100vw, 1000px" />
            <a className={styles.qrLink} href={WEDDING.mapUrl} target="_blank" rel="noreferrer" aria-label={`เปิดแผนที่ ${WEDDING.venue}`}>
              <Image className={styles.qrArt} src={`${media}/6293e1428f15322db19dd1dd22b91950.png`} alt="คิวอาร์โค้ดแผนที่ Celebce Venue" width={771} height={790} sizes="180px" />
            </a>
          </div>
        </section>

        <section className={styles.dressSection} aria-labelledby="dress-heading">
          <div className={styles.dressCard}>
            <h2 id="dress-heading" className={styles.srOnly}>dress code theme</h2>
            <div className={styles.srOnly}>
              <p>strictly formal</p>
              <p>กรุณาแต่งกายด้วยชุดสุภาพในโทนสีน้ำตาลและเบจ</p>
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

        <section className={styles.editorialSection} aria-label="ภาพความทรงจำของคู่บ่าวสาว">
          <div className={styles.editorialGrid}>
            {editorialGallery.map((photo) => (
              <figure key={photo.src} className={'wide' in photo && photo.wide ? styles.widePhoto : undefined}>
                <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes={('wide' in photo && photo.wide) ? '(max-width: 720px) 100vw, 1366px' : '(max-width: 720px) 50vw, 650px'} />
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.rsvpSection} id="rsvp" aria-label="ตอบรับคำเชิญ">
          <div className={styles.rsvpBackdrop} aria-hidden="true">
            <Image src={`${photos}/rings-silhouette.webp`} alt="" width={1081} height={952} sizes="(max-width: 720px) 100vw, 1366px" />
          </div>
          <div className={styles.rsvpContent}>
            <p className={styles.rsvpTitle}>RSVP</p>
            <p className={styles.rsvpDeadline}>kindly reply by<br /><time dateTime="2026-11-27">27.11.2026</time></p>
            {personalized && invitation ? (
              <>
                {invitation.status !== 'pending' && !editing ? (
                  <div className="rsvp-summary">
                    <PartyPopper size={34} />
                    <h3>{invitation.status === 'accepted' ? 'ดีใจที่จะได้เจอกัน!' : 'เราเก็บคำตอบไว้แล้ว'}</h3>
                    <p>{invitation.status === 'accepted' ? `มาร่วมงาน ${invitation.adultCount + invitation.childCount} คน` : invitation.status === 'maybe' ? 'ยังไม่แน่ใจ' : 'ไม่สะดวกมาร่วม'}</p>
                    {invitation.tableNumbers.length > 0 ? <p className={styles.tableBadge}>โต๊ะ {invitation.tableNumbers.join(', ')}</p> : null}
                    {invitation.status === 'accepted' ? (
                      <div className="accepted-calendar">
                        <CalendarDays size={28} />
                        <div><p>save the date</p><h4>เพิ่มลงปฏิทินไว้เลย</h4></div>
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
                  <p>วันงานใช้ <strong>รหัสเชิญ {invitation.inviteCode}</strong> เพื่อเช็กอินด้วยตัวเอง</p>
                </aside>
              </>
            ) : (
              <div className={styles.publicRsvp}>
                <Heart aria-hidden="true" />
                <p>กรุณาเปิดลิงก์คำเชิญส่วนตัวเพื่อส่งคำตอบ</p>
                <small>ลิงก์ส่วนตัวช่วยให้เราจัดที่นั่งและดูแลแขกทุกคนได้อย่างพอดี</small>
              </div>
            )}
          </div>
        </section>

        <footer className={styles.footer}><p>ณัฐพล &amp; เพ็ญพิสุทธิ์</p><span>04 · 12 · 2026</span></footer>
      </main>
    </div>
  );
}
