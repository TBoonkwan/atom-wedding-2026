import Image from 'next/image';
import Link from 'next/link';
import {
  DRAFTS,
  getDraft,
  WEDDING_DRAFT_FACTS,
  type DraftTheme,
} from './draft-data';

const facts = WEDDING_DRAFT_FACTS;

function WeddingPhoto({ className = '' }: { className?: string }) {
  return (
    <div className={`draft-photo ${className}`}>
      <Image
        src="/gallery/photo-08.jpg"
        alt="Nathapol and Pennisut holding their wedding rings"
        fill
        sizes="(max-width: 760px) 100vw, 62vw"
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
          NATHAPOL <i>&amp;</i> PENNISUT
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
          NATHAPOL <i>&amp;</i>
          <br />
          PENNISUT
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
        <span className="pop-note">Tea · Dinner · Dance</span>
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
          NATHAPOL
          <br />
          PENNISUT
        </h1>
      </div>
      <div className="afterdark-ticket">
        <p>Date of admission</p>
        <strong>{facts.date}</strong>
        <span>{facts.time}</span>
        <b aria-hidden="true">囍</b>
        <dl>
          <div>
            <dt>Venue</dt>
            <dd>{facts.venue}</dd>
          </div>
          <div>
            <dt>Running order</dt>
            <dd>{facts.programme}</dd>
          </div>
        </dl>
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

export function WeddingLandingDraft({ theme }: { theme: DraftTheme }) {
  const draft = getDraft(theme);
  const Hero = HEROES[theme];

  return (
    <main className="landing-draft" data-draft={theme}>
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
      <section className="draft-detail-strip" id="draft-details" tabIndex={-1}>
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
    </main>
  );
}
