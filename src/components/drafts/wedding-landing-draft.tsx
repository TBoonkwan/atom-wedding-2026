import Image from 'next/image';
import Link from 'next/link';
import { TIMELINE, WEDDING } from '@/lib/domain/event';
import {
  DRAFTS,
  getDraft,
  WEDDING_DRAFT_FACTS,
  type DraftTheme,
} from './draft-data';
import './drafts.css';

const facts = WEDDING_DRAFT_FACTS;
const [partnerOne, partnerTwo] = facts.names.split(' & ');

const afterdarkGallery = [
  { src: '/gallery/photo-02.jpg', alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดสีดำยืนใกล้กัน' },
  { src: '/gallery/photo-03.jpg', alt: 'ภาพสตูดิโอของณัฐพลและเพ็ญพิสุทธิ์' },
  { src: '/gallery/photo-04.jpg', alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานจีนสีแดง' },
  { src: '/gallery/photo-07.jpg', alt: 'ณัฐพลและเพ็ญพิสุทธิ์ในชุดแต่งงานสีขาว' },
] as const;

const weddingColors = [
  { number: '01', name: 'Chocolate Brown', value: '#553725' },
  { number: '02', name: 'Mocha', value: '#987863' },
  { number: '03', name: 'Dusty Pink', value: '#d1afa6' },
  { number: '04', name: 'Blush Pink', value: '#d5acab' },
] as const;

function WeddingPhoto({ className = '' }: { className?: string }) {
  return (
    <div className={`draft-photo ${className}`}>
      <Image
        src="/gallery/photo-08.jpg"
        alt={`${partnerOne} and ${partnerTwo} holding their wedding rings`}
        fill
        sizes="(max-width: 960px) 100vw, 64vw"
        loading="eager"
      />
    </div>
  );
}

function NeonHero() {
  return (
    <section className="draft-hero neon-hero">
      <div className="neon-title">
        <h1>
          {partnerOne} <i>&amp;</i> {partnerTwo}
        </h1>
      </div>
      <WeddingPhoto />
      <p className="neon-issue">Wedding issue · Bangkok after dark</p>
      <strong className="neon-date">{facts.date}</strong>
      <span className="neon-sticker" aria-hidden="true">
        YES!<br />
        OFFICIAL
      </span>
      <a className="draft-enter neon-enter" href="#draft-details">
        Enter our wedding
      </a>
    </section>
  );
}

function PopHero() {
  return (
    <section className="draft-hero pop-hero">
      <div className="pop-copy">
        <p>One day only · made with love</p>
        <h1>
          {partnerOne} <i>&amp;</i>
          <br />
          {partnerTwo}
        </h1>
        <div className="pop-date">
          <strong>{facts.date}</strong>
          <span>
            {facts.time}
            <br />
            {facts.venue}
          </span>
        </div>
        <a className="draft-enter pop-enter" href="#draft-details">
          Enter our wedding <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="pop-collage">
        <WeddingPhoto />
        <span className="pop-stamp" aria-hidden="true">
          YES!
        </span>
        <span className="pop-note">{facts.programme}</span>
      </div>
    </section>
  );
}

function AfterdarkHero() {
  return (
    <section className="draft-hero afterdark-hero">
      <div className="afterdark-visual">
        <WeddingPhoto />
        <p>Presents / a union after dark</p>
        <h1>
          {partnerOne}
          <br />
          {partnerTwo}
        </h1>
      </div>
      <div className="afterdark-ticket">
        <p>Date of admission</p>
        <strong>{facts.date}</strong>
        <span>{facts.time}</span>
        <b aria-hidden="true">囍</b>
        <dl>
          <div>
            <dt>
              <span className="afterdark-detail-number">01</span>
              Venue
            </dt>
            <dd>{facts.venue}</dd>
          </div>
          <div>
            <dt>
              <span className="afterdark-detail-number">02</span>
              Running order
            </dt>
            <dd>{facts.programme}</dd>
          </div>
        </dl>
        <span className="afterdark-barcode" aria-hidden="true" />
        <a className="draft-enter afterdark-enter" href="#draft-details">
          Enter our wedding <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

const HEROES: Record<DraftTheme, () => React.JSX.Element> = {
  'neon-editorial': NeonHero,
  'pop-postcard': PopHero,
  'afterdark-ticket': AfterdarkHero,
};

function AfterdarkFullSections() {
  return (
    <div className="afterdark-full">
      <section
        className="afterdark-section afterdark-schedule"
        aria-labelledby="afterdark-schedule-heading"
      >
        <p className="afterdark-kicker">03 / RUNNING ORDER</p>
        <h2 id="afterdark-schedule-heading">The running order</h2>
        <ol>
          {TIMELINE.map((item, index) => (
            <li key={item.time}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <time>{item.time}</time>
              <i aria-hidden="true">{item.icon}</i>
              <strong>{item.title}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="afterdark-section afterdark-venue"
        aria-labelledby="afterdark-venue-heading"
      >
        <div className="afterdark-map-grid" aria-hidden="true">
          <span>CELEBCE</span>
          <b>04.12</b>
        </div>
        <div className="afterdark-venue-copy">
          <p className="afterdark-kicker">04 / LOCATION</p>
          <h2 id="afterdark-venue-heading">{WEDDING.venue}</h2>
          <p>{WEDDING.address}</p>
          <a href={WEDDING.mapUrl} target="_blank" rel="noreferrer">
            เปิดแผนที่และนำทาง
          </a>
        </div>
      </section>

      <section
        className="afterdark-section afterdark-colors"
        aria-labelledby="afterdark-colors-heading"
      >
        <p className="afterdark-kicker">05 / DRESS CODE</p>
        <h2 id="afterdark-colors-heading">Wedding colors</h2>
        <ul>
          {weddingColors.map((color) => (
            <li key={color.name}>
              <span style={{ background: color.value }} aria-hidden="true" />
              <b>{color.number}</b>
              <strong>{color.name}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="afterdark-section afterdark-gallery"
        aria-labelledby="afterdark-gallery-heading"
      >
        <p className="afterdark-kicker">06 / CONTACT SHEET</p>
        <h2 id="afterdark-gallery-heading">Before we meet</h2>
        <div>
          {afterdarkGallery.map((image, index) => (
            <figure key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                width={1200}
                height={1800}
                sizes="(max-width: 720px) calc(100vw - 40px), 50vw"
                loading="lazy"
              />
              <figcaption>{String(index + 1).padStart(2, '0')} / 04</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section
        className="afterdark-section afterdark-rsvp"
        aria-labelledby="afterdark-rsvp-heading"
      >
        <p className="afterdark-preview-label">Preview only</p>
        <p className="afterdark-kicker">07 / RESPONSE</p>
        <h2 id="afterdark-rsvp-heading">RSVP preview</h2>
        <p>ฟอร์มจริงจะแสดงบนลิงก์เชิญส่วนตัวของแขกแต่ละคน</p>
        <ul aria-label="ตัวเลือกตอบรับคำเชิญ">
          <li>มาร่วมงาน</li>
          <li>ยังไม่แน่ใจ</li>
          <li>ไม่สะดวกมาร่วม</li>
        </ul>
      </section>

      <footer className="afterdark-closing">
        <span>NP</span>
        <p>04 · 12 · 2026</p>
        <a href="#afterdark-top">Back to top</a>
      </footer>
    </div>
  );
}

export function WeddingLandingDraft({ theme }: { theme: DraftTheme }) {
  const draft = getDraft(theme);
  const Hero = HEROES[theme];

  return (
    <main
      className="landing-draft"
      data-draft={theme}
      id={theme === 'afterdark-ticket' ? 'afterdark-top' : undefined}
    >
      <nav className="draft-nav" aria-label="Draft navigation">
        <Link href="/drafts">All drafts</Link>
        <span className="draft-direction-title">{draft.title}</span>
        <div>
          {DRAFTS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-label={`View ${item.title} draft`}
              aria-current={item.id === theme ? 'page' : undefined}
            >
              {item.number}
            </Link>
          ))}
        </div>
      </nav>
      <Hero />
      <section
        className="draft-detail-strip"
        id="draft-details"
        aria-label="Wedding event details"
        tabIndex={-1}
      >
        <p>
          <span>Date</span>
          <strong>{facts.date}</strong>
        </p>
        <p>
          <span>Time</span>
          <strong>{facts.time}</strong>
        </p>
        <p>
          <span>Venue</span>
          <strong>{facts.venue}</strong>
        </p>
        <p>
          <span>Programme</span>
          <strong>{facts.programme}</strong>
        </p>
      </section>
      {theme === 'afterdark-ticket' ? <AfterdarkFullSections /> : null}
    </main>
  );
}
