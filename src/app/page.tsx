import Link from 'next/link';
import { ArrowUpRight, Heart, LayoutDashboard, QrCode } from 'lucide-react';

export default function Home() {
  const drafts = [
    { slug: 'blush-shanghai', number: '01', title: 'Blush Shanghai', note: 'Editorial · เรียบหรู · ตราประทับจีน' },
    { slug: 'tea-to-toast', number: '02', title: 'Tea to Toast', note: 'อบอุ่น · ยกน้ำชา · คราฟต์เบียร์' },
    { slug: 'modern-xi-club', number: '03', title: 'Modern 囍 Club', note: 'กราฟิก · สนุก · After Party' },
  ];
  return (
    <main className="draft-index">
      <header className="draft-index-hero">
        <span className="mini-seal">囍</span>
        <p>WEDDING WEBSITE · VISUAL DIRECTIONS</p>
        <h1>สามบรรยากาศ<br /><em>สำหรับวันเดียวกัน</em></h1>
        <div className="index-meta"><span>ณัฐพล & เพ็ญพิสุทธิ์</span><span>04.12.2026</span><span>Celebce Venue</span></div>
      </header>
      <section className="draft-card-grid">
        {drafts.map((draft) => (
          <Link className={`draft-card ${draft.slug}`} href={`/preview/${draft.slug}`} key={draft.slug}>
            <span className="draft-number">{draft.number}</span>
            <div><p>{draft.note}</p><h2>{draft.title}</h2></div>
            <ArrowUpRight />
          </Link>
        ))}
      </section>
      <section className="index-tools">
        <Link href="/i/demo-np-2026"><Heart size={19} /> Production guest flow</Link>
        <Link href="/host"><LayoutDashboard size={19} /> Host dashboard</Link>
        <Link href="/check-in?eventCode=NP-AT-VENUE"><QrCode size={19} /> Self check-in</Link>
      </section>
      <footer className="index-footer">Clickable prototype · Supabase-ready · Mobile first</footer>
    </main>
  );
}
