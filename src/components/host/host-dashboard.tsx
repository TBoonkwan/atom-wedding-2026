'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Baby, Beer, CalendarClock, CheckCircle2, ClipboardList, Download, LayoutDashboard,
  Plus, Search, TableProperties, Upload, Users, XCircle,
} from 'lucide-react';
import type { Invitation, RsvpHistoryEntry } from '@/lib/domain/types';
import { GuestCreateModal } from './guest-create-modal';
import { TablePlanner, type TableSummary } from './table-planner';

interface Summary {
  statuses: { accepted: number; maybe: number; rejected: number; pending: number };
  expectedGuests: number;
  children: number;
  childSeats: number;
  checkedInGuests: number;
  lateResponses: number;
  beerPreferences: { ipa: number; lager: number; wheat: number; none: number };
  allergies: { displayName: string; notes: string }[];
  accessibilityNeeds: { displayName: string; notes: string }[];
  capacity: number;
}

type Tab = 'overview' | 'guests' | 'tables';

export function HostDashboard({ email, demo }: { email: string; demo: boolean }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [editing, setEditing] = useState<Invitation | null>(null);
  const [rsvpHistory, setRsvpHistory] = useState<RsvpHistoryEntry[]>([]);

  const load = useCallback(async () => {
    const response = await fetch('/api/host/overview', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setSummary(data.summary);
    setInvitations(data.invitations);
    setTables(data.tables);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 15_000);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
    const supabase = createBrowserClient(url, key);
    const channel = supabase
      .channel('host-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations' }, load)
      .subscribe();
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const filtered = useMemo(() => invitations.filter((invitation) =>
    `${invitation.displayName} ${invitation.contactName} ${invitation.inviteCode} ${invitation.phone ?? ''} ${invitation.email ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  ), [invitations, search]);

  async function importCsv(file: File) {
    const csv = await file.text();
    const response = await fetch('/api/host/guests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }),
    });
    const data = await response.json();
    setNotice(response.ok ? `นำเข้าแล้ว ${data.imported} รายชื่อ` : data.errors?.join(' · ') ?? data.error);
    if (response.ok) {
      await load();
    }
  }

  async function guestCreated() {
    setNotice('เพิ่มแขกแล้ว');
    await load();
  }

  async function copySharedLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/`);
      setNotice('คัดลอกลิงก์กลางแล้ว ส่งลิงก์นี้ให้แขกทุกคนได้เลย');
    } catch {
      setNotice(`ลิงก์กลาง: ${window.location.origin}/`);
    }
  }

  async function openGuest(guest: Invitation) {
    setEditing(guest);
    setRsvpHistory([]);
    const response = await fetch(`/api/host/invitations/${encodeURIComponent(guest.id)}/history`, {
      cache: 'no-store',
    });
    if (response.ok) setRsvpHistory(await response.json());
  }

  async function saveGuest() {
    if (!editing) return;
    const response = await fetch('/api/host/guests', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        id: editing.id, displayName: editing.displayName, contactName: editing.contactName,
        phone: editing.phone ?? '', email: editing.email ?? '', hostNotes: editing.hostNotes ?? '',
      }),
    });
    setNotice(response.ok ? 'บันทึกข้อมูลแขกแล้ว' : 'บันทึกไม่สำเร็จ');
    if (response.ok) { setEditing(null); await load(); }
  }

  async function assignTable(tableId: string, invitationId: string, seatCount: number) {
    if (!invitationId || seatCount < 1) return false;
    try {
      const response = await fetch('/api/host/tables', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', tableId, invitationId, seatCount }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error ?? 'จัดโต๊ะไม่สำเร็จ');
        return false;
      }
      await load();
      return true;
    } catch {
      setNotice('เชื่อมต่อระบบไม่สำเร็จ กรุณาลองจัดโต๊ะอีกครั้ง');
      return false;
    }
  }

  async function toggleReveal(table: TableSummary) {
    await fetch('/api/host/tables', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reveal', tableId: table.id, revealed: !table.revealed }),
    });
    await load();
  }

  async function removeAssignment(tableId: string, invitationId: string) {
    await fetch('/api/host/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', tableId, invitationId }),
    });
    await load();
  }

  const nav = [
    ['overview', 'ภาพรวม', LayoutDashboard], ['guests', 'รายชื่อแขก', ClipboardList],
    ['tables', 'จัดโต๊ะ', TableProperties],
  ] as const;

  return (
    <main className="host-shell">
      <aside className="host-sidebar">
        <div className="host-brand"><span>NP</span><div><strong>Wedding Host</strong><small>04.12.2026</small></div></div>
        <nav>{nav.map(([key, label, Icon]) => <button className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}><Icon size={18} />{label}</button>)}</nav>
        <div className="host-account"><small>{demo ? 'DEMO MODE' : 'SIGNED IN'}</small><span>{email}</span>{!demo ? <form action="/api/auth/sign-out" method="post"><button type="submit">ออกจากระบบ</button></form> : null}</div>
      </aside>
      <section className="host-content">
        <header className="host-topbar"><div><p>CELEBCE VENUE</p><h1>{nav.find(([key]) => key === tab)?.[1]}</h1></div><a className="host-outline-button" href="/api/host/export"><Download size={17} /> Export CSV</a></header>
        <section className="host-panel" aria-label="ลิงก์เชิญกลาง"><h2>ลิงก์เดียวสำหรับแขกทุกคน</h2><p>แขกเปิดลิงก์ กรอกชื่อ แล้วตอบรับได้เลย</p><button type="button" className="host-primary-button" onClick={copySharedLink}>คัดลอกลิงก์กลาง</button></section>
        {notice ? <div className="host-notice">{notice}<button onClick={() => setNotice('')}>×</button></div> : null}

        {tab === 'overview' && summary ? <>
          {summary.expectedGuests >= 270 ? <div className={summary.expectedGuests > summary.capacity ? 'capacity-warning over' : 'capacity-warning'}>{summary.expectedGuests > summary.capacity ? `ยอดตอบรับเกินความจุ ${summary.expectedGuests - summary.capacity} คน` : `ยอดตอบรับใกล้เต็ม เหลือ ${summary.capacity - summary.expectedGuests} คน`}</div> : null}
          <div className="host-metric-grid">
            <Metric icon={Users} label="ผู้ร่วมงาน" value={`${summary.expectedGuests} / ${summary.capacity}`} tone={summary.expectedGuests > 300 ? 'danger' : 'rose'} />
            <Metric icon={CheckCircle2} label="ตอบรับมา" value={summary.statuses.accepted} tone="green" />
            <Metric icon={CalendarClock} label="ยังไม่ตอบ" value={summary.statuses.pending} tone="gold" />
          </div>
          <div className="host-two-column">
            <article className="host-panel"><h2>RSVP status</h2><div className="capacity-bar"><span style={{ width: `${Math.min(100, summary.expectedGuests / 3)}%` }} /></div><ul className="status-list"><li><i className="green"/>Accept <strong>{summary.statuses.accepted}</strong></li><li><i className="gold"/>Maybe <strong>{summary.statuses.maybe}</strong></li><li><i className="red"/>Reject <strong>{summary.statuses.rejected}</strong></li><li><i className="gray"/>Pending <strong>{summary.statuses.pending}</strong></li></ul></article>
            <article className="host-panel"><h2>สิ่งที่ต้องเตรียม</h2><div className="preference-grid"><span><Baby/>เด็ก <strong>{summary.children}</strong></span><span><Baby/>เก้าอี้เด็ก <strong>{summary.childSeats}</strong></span><span><Beer/>IPA <strong>{summary.beerPreferences.ipa}</strong></span><span><Beer/>Wheat <strong>{summary.beerPreferences.wheat}</strong></span></div><div className="needs-list"><strong>อาหาร / การดูแลพิเศษ</strong>{summary.allergies.map((item) => <p key={`allergy-${item.displayName}`}><b>{item.displayName}</b> · {item.notes}</p>)}{summary.accessibilityNeeds.map((item) => <p key={`access-${item.displayName}`}><b>{item.displayName}</b> · {item.notes}</p>)}{summary.allergies.length + summary.accessibilityNeeds.length === 0 ? <p>ไม่มีรายการแจ้งไว้</p> : null}</div><p className="late-note">ตอบหลัง deadline {summary.lateResponses} invitation</p></article>
          </div>
        </> : null}

        {tab === 'guests' ? <div className="host-panel guest-panel">
          <div className="panel-toolbar">
            <label className="host-search"><Search size={17}/><input placeholder="ค้นหาชื่อหรือรหัสเชิญ" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <div className="guest-toolbar-actions">
              <button type="button" className="host-outline-button" onClick={() => setCreatingGuest(true)}><Plus size={17}/> เพิ่มแขก</button>
              <label className="host-primary-button"><Upload size={17}/> Import CSV<input type="file" accept=".csv,text/csv" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} /></label>
            </div>
          </div>
          <div className="guest-table-wrap"><table className="guest-table"><thead><tr><th>Invitation</th><th>Status</th><th>เหตุผล</th><th>จำนวน</th><th>โต๊ะ</th></tr></thead><tbody>{filtered.map((guest) => <tr key={guest.id}><td><button type="button" className="guest-row-button" onClick={() => void openGuest(guest)}><strong>{guest.displayName}</strong><small>{guest.inviteCode}</small></button></td><td><span className={`status-pill ${guest.status}`}>{guest.status}</span></td><td className="guest-reason-cell">{reasonForGuest(guest)}</td><td>{guest.adultCount + guest.childCount}</td><td>{guest.tableNumbers.join(', ') || '—'}</td></tr>)}</tbody></table></div>
        </div> : null}

        {creatingGuest ? <GuestCreateModal onClose={() => setCreatingGuest(false)} onCreated={guestCreated} /> : null}

        {editing ? <div className="host-modal-backdrop"><div className="host-modal">
          <button type="button" className="modal-close" aria-label="ปิดหน้าต่างแก้ไข" onClick={() => setEditing(null)}><XCircle /></button>
          <h2>แก้ไข invitation</h2>
          <label>ชื่อบนคำเชิญ<input value={editing.displayName} onChange={(event) => setEditing({ ...editing, displayName: event.target.value })}/></label>
          <label>ชื่อผู้ติดต่อ<input value={editing.contactName} onChange={(event) => setEditing({ ...editing, contactName: event.target.value })}/></label>
          <label>โทรศัพท์<input value={editing.phone ?? ''} onChange={(event) => setEditing({ ...editing, phone: event.target.value })}/></label>
          <label>อีเมล<input value={editing.email ?? ''} onChange={(event) => setEditing({ ...editing, email: event.target.value })}/></label>
          <label>โน้ต host<textarea value={editing.hostNotes ?? ''} onChange={(event) => setEditing({ ...editing, hostNotes: event.target.value })}/></label>
          <button className="host-primary-button" onClick={saveGuest}>บันทึกข้อมูลแขก</button>
          <div className="modal-divider" />
          <h3>ประวัติ RSVP</h3>
          {rsvpHistory.length > 0 ? <ol className="rsvp-history-list">{rsvpHistory.map((entry) => {
            const status = String(entry.snapshot.status ?? 'updated');
            const adults = Number(entry.snapshot.adultCount ?? entry.snapshot.adult_count ?? 0);
            const children = Number(entry.snapshot.childCount ?? entry.snapshot.child_count ?? 0);
            return <li key={entry.id}><span className={`status-pill ${status}`}>{status}</span><strong>{adults + children} คน</strong><time>{new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(entry.createdAt))}</time></li>;
          })}</ol> : <p className="modal-help">ยังไม่มีประวัติการตอบกลับ</p>}
          <div className="modal-divider" />
        </div></div> : null}

        {tab === 'tables' ? (
          <TablePlanner
            invitations={invitations}
            tables={tables}
            onAssign={assignTable}
            onRemove={removeAssignment}
            onToggleReveal={toggleReveal}
          />
        ) : null}


      </section>
    </main>
  );
}

function reasonForGuest(invitation: Invitation) {
  if (invitation.status !== 'maybe' && invitation.status !== 'rejected') return '—';
  return invitation.reason?.trim() || '—';
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string | number; tone: string }) {
  return <article className={`host-metric ${tone}`}><span><Icon size={19}/></span><div><p>{label}</p><strong>{value}</strong></div></article>;
}
