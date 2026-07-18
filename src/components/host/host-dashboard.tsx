'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { QRCodeSVG } from 'qrcode.react';
import {
  Baby, Beer, CalendarClock, CheckCircle2, ClipboardList, Download, LayoutDashboard,
  Plus, QrCode, Search, TableProperties, Upload, Users, XCircle,
} from 'lucide-react';
import type { Invitation, RsvpHistoryEntry } from '@/lib/domain/types';
import { csvCell } from '@/lib/domain/csv-export';
import { invitationUrl as buildInvitationUrl } from '@/lib/domain/invitation-url';
import { GuestCreateModal, type ImportedLink } from './guest-create-modal';
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

type Tab = 'overview' | 'guests' | 'tables' | 'checkin';

export function HostDashboard({ email, demo }: { email: string; demo: boolean }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [checkInCode, setCheckInCode] = useState(demo ? 'NP-AT-VENUE' : '');
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [editing, setEditing] = useState<Invitation | null>(null);
  const [importedLinks, setImportedLinks] = useState<ImportedLink[]>([]);
  const [rotatedLink, setRotatedLink] = useState('');
  const [rsvpHistory, setRsvpHistory] = useState<RsvpHistoryEntry[]>([]);

  const load = useCallback(async () => {
    const response = await fetch('/api/host/overview', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setSummary(data.summary);
    setInvitations(data.invitations);
    setTables(data.tables);
    setCheckInCode(data.checkInCode ?? '');
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, load)
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
    setNotice(response.ok ? `นำเข้าแล้ว ${data.imported} invitation — กรุณาดาวน์โหลดลิงก์ก่อนปิดหน้านี้` : data.errors?.join(' · ') ?? data.error);
    if (response.ok) {
      setImportedLinks(data.links);
      await load();
    }
  }

  async function guestCreated(links: ImportedLink[]) {
    setImportedLinks((current) => [...current, ...links]);
    setNotice('เพิ่มแขกและสร้างลิงก์เชิญแล้ว — กรุณาเก็บลิงก์ก่อนปิดหน้านี้');
    await load();
  }

  function invitationUrl(token: string) {
    return buildInvitationUrl(window.location.origin, token);
  }

  function downloadImportedLinks() {
    const rows = importedLinks.map((item) =>
      [item.displayName, item.inviteCode, invitationUrl(item.token)].map(csvCell).join(','),
    );
    const blob = new Blob([`display_name,invite_code,invitation_url\n${rows.join('\n')}`], {
      type: 'text/csv;charset=utf-8',
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `np-invitation-links-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  async function openGuest(guest: Invitation) {
    setEditing(guest);
    setRotatedLink('');
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

  async function saveCheckIn() {
    if (!editing) return;
    const response = await fetch('/api/host/check-ins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: editing.id,
        attendeeCount: editing.checkedInCount,
      }),
    });
    const data = await response.json();
    setNotice(response.ok ? (editing.checkedInCount === 0 ? 'ยกเลิกเช็กอินแล้ว' : 'แก้จำนวนเช็กอินแล้ว') : data.error ?? 'แก้เช็กอินไม่สำเร็จ');
    if (response.ok) {
      setEditing(data);
      await load();
    }
  }

  async function rotateLink() {
    if (!editing) return;
    if (!window.confirm('สร้างลิงก์ใหม่และยกเลิกลิงก์เดิมใช่ไหม?')) return;
    const response = await fetch(`/api/host/invitations/${encodeURIComponent(editing.id)}/rotate-token`, {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error ?? 'สร้างลิงก์ไม่สำเร็จ');
      return;
    }
    setRotatedLink(invitationUrl(data.token));
    setEditing({ ...editing, inviteCode: data.inviteCode });
    await load();
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

  async function toggleCheckIn(enabled: boolean) {
    const response = await fetch('/api/host/check-in-control', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }),
    });
    const data = await response.json();
    setCheckInCode(data.code ?? '');
  }

  const nav = [
    ['overview', 'ภาพรวม', LayoutDashboard], ['guests', 'รายชื่อแขก', ClipboardList],
    ['tables', 'จัดโต๊ะ', TableProperties], ['checkin', 'เช็กอิน', QrCode],
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
        {notice ? <div className="host-notice">{notice}<button onClick={() => setNotice('')}>×</button></div> : null}

        {tab === 'overview' && summary ? <>
          {summary.expectedGuests >= 270 ? <div className={summary.expectedGuests > summary.capacity ? 'capacity-warning over' : 'capacity-warning'}>{summary.expectedGuests > summary.capacity ? `ยอดตอบรับเกินความจุ ${summary.expectedGuests - summary.capacity} คน` : `ยอดตอบรับใกล้เต็ม เหลือ ${summary.capacity - summary.expectedGuests} คน`}</div> : null}
          <div className="host-metric-grid">
            <Metric icon={Users} label="ผู้ร่วมงาน" value={`${summary.expectedGuests} / ${summary.capacity}`} tone={summary.expectedGuests > 300 ? 'danger' : 'rose'} />
            <Metric icon={CheckCircle2} label="ตอบรับมา" value={summary.statuses.accepted} tone="green" />
            <Metric icon={CalendarClock} label="ยังไม่ตอบ" value={summary.statuses.pending} tone="gold" />
            <Metric icon={QrCode} label="เช็กอินแล้ว" value={summary.checkedInGuests} tone="brown" />
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
          {importedLinks.length > 0 ? <section className="imported-links" aria-label="ลิงก์เชิญที่เพิ่งสร้าง">
            <div><div><strong>ลิงก์เชิญที่เพิ่งสร้าง</strong><p>Token จะแสดงครั้งเดียว ดาวน์โหลดเก็บไว้ก่อนออกจากหน้านี้</p></div><button className="host-outline-button" onClick={downloadImportedLinks}><Download size={16}/> Download links</button></div>
            <ul>{importedLinks.map((item) => <li key={item.token}><span><strong>{item.displayName}</strong><small>{item.inviteCode}</small></span><button onClick={() => void navigator.clipboard.writeText(invitationUrl(item.token))}>คัดลอกลิงก์</button></li>)}</ul>
          </section> : null}
          <div className="guest-table-wrap"><table className="guest-table"><thead><tr><th>Invitation</th><th>Status</th><th>เหตุผล</th><th>จำนวน</th><th>โต๊ะ</th><th>เช็กอิน</th></tr></thead><tbody>{filtered.map((guest) => <tr key={guest.id}><td><button type="button" className="guest-row-button" onClick={() => void openGuest(guest)}><strong>{guest.displayName}</strong><small>{guest.inviteCode}</small></button></td><td><span className={`status-pill ${guest.status}`}>{guest.status}</span></td><td className="guest-reason-cell">{reasonForGuest(guest)}</td><td>{guest.adultCount + guest.childCount}</td><td>{guest.tableNumbers.join(', ') || '—'}</td><td>{guest.checkedInCount}</td></tr>)}</tbody></table></div>
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
          <h3>เช็กอินจริง</h3>
          <div className="modal-inline-control"><input aria-label="จำนวนผู้เช็กอินจริง" type="number" min="0" max="300" value={editing.checkedInCount} onChange={(event) => setEditing({ ...editing, checkedInCount: Number(event.target.value) })}/><button className="host-outline-button" onClick={saveCheckIn}>{editing.checkedInCount === 0 ? 'ยกเลิกเช็กอิน' : 'แก้จำนวน'}</button></div>
          <div className="modal-divider" />
          <h3>ลิงก์คำเชิญ</h3>
          <p className="modal-help">ระบบเก็บเฉพาะ token hash หากไฟล์ลิงก์เดิมสูญหาย ต้องสร้างใหม่และลิงก์เดิมจะใช้ไม่ได้</p>
          <button className="host-outline-button" onClick={rotateLink}>สร้างลิงก์ใหม่</button>
          {rotatedLink ? <div className="rotated-link"><QRCodeSVG value={rotatedLink} size={148}/><code>{rotatedLink}</code><button className="host-primary-button" onClick={() => void navigator.clipboard.writeText(rotatedLink)}>คัดลอกลิงก์</button></div> : null}
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

        {tab === 'checkin' ? <div className="host-two-column"><article className="host-panel checkin-control"><p className="section-kicker">SELF CHECK-IN</p><h2>QR กลางหน้างาน</h2><p>เปิดใช้งานเมื่อทีมต้อนรับพร้อม ระบบจะสร้างรหัสใหม่สำหรับ QR นี้</p><div className="checkin-buttons"><button className="host-primary-button" onClick={() => toggleCheckIn(true)}>เปิดเช็กอิน</button><button className="host-outline-button" onClick={() => toggleCheckIn(false)}>ปิด</button></div></article><article className="host-panel qr-panel">{checkInCode ? <><QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/check-in?eventCode=${encodeURIComponent(checkInCode)}`} size={230} level="M"/><strong>{checkInCode}</strong><small>แขกสแกน QR แล้วกรอกรหัส invitation 6 ตัว</small></> : <p>เช็กอินปิดอยู่</p>}</article></div> : null}
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
