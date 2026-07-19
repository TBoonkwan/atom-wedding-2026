import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DRAFTS, WEDDING_DRAFT_FACTS } from './draft-data';
import './drafts.css';

export function DraftIndex() {
  return (
    <main className="landing-drafts">
      <header className="drafts-intro">
        <span className="drafts-seal" aria-hidden="true">囍</span>
        <p className="drafts-kicker">NATHAPOL × PENNISUT · 04 DEC 2026</p>
        <h1>Three ways to say<br /><em>we’re getting married.</em></h1>
        <p>Three clickable directions using the same photograph and event details.</p>
      </header>
      <section className="drafts-grid" aria-label="Wedding landing page directions">
        {DRAFTS.map((draft) => (
          <article className="draft-preview-card" data-preview={draft.id} key={draft.id}>
            <div className="draft-preview-photo">
              <Image
                src="/gallery/photo-08.jpg"
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 33vw"
              />
              <span aria-hidden="true">{draft.number}</span>
            </div>
            <div className="draft-preview-copy">
              <p>{draft.strapline}</p>
              <h2>{draft.title}</h2>
              <p>{draft.description}</p>
              <div className="draft-palette" aria-hidden="true">
                {draft.palette.map((color) => (
                  <span key={color} style={{ '--draft-swatch': color } as CSSProperties} />
                ))}
              </div>
              <Link href={draft.href} aria-label={`Open draft ${draft.number}`}>
                Open draft <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        ))}
      </section>
      <footer className="drafts-footer">
        <span>{WEDDING_DRAFT_FACTS.date}</span>
        <span>{WEDDING_DRAFT_FACTS.venue}</span>
      </footer>
    </main>
  );
}
