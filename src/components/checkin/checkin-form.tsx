'use client';

import { useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, QrCode, Users } from 'lucide-react';

const subscribeToRememberedInvitation = () => () => undefined;

export function CheckInForm({ eventCode }: { eventCode: string }) {
  const [typedInviteCode, setTypedInviteCode] = useState<string | null>(null);
  const rememberedInviteCode = useSyncExternalStore(
    subscribeToRememberedInvitation,
    () => window.localStorage.getItem('np-wedding-invite-code') ?? '',
    () => '',
  );
  const inviteCode = typedInviteCode ?? rememberedInviteCode;
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [result, setResult] = useState<{ displayName: string; checkedInCount: number; tableNumbers: number[] } | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventCode, inviteCode, attendeeCount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'เช็กอินไม่สำเร็จ');
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'เช็กอินไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <div className="checkin-success">
        <CheckCircle2 size={62} />
        <p>เช็กอินเรียบร้อย</p>
        <h1>ยินดีต้อนรับ<br />{result.displayName}</h1>
        <div className="arrival-count"><Users size={18} /> {result.checkedInCount} คน</div>
        {result.tableNumbers.length > 0 ? <p className="arrival-table">โต๊ะ {result.tableNumbers.join(', ')}</p> : <p>ทีมงานจะแจ้งโต๊ะให้ทราบอีกครั้ง</p>}
        <Link href="/">กลับหน้าหลัก</Link>
      </div>
    );
  }

  return (
    <form className="checkin-form" onSubmit={submit}>
      <div className="checkin-icon"><QrCode size={34} /></div>
      <p className="section-kicker">WELCOME TO CELEBCE VENUE</p>
      <h1>เช็กอินด้วยตัวเอง</h1>
      <p>กรอกรหัส 6 ตัวจากลิงก์คำเชิญ และจำนวนคนที่มาถึงจริง</p>
      <label>รหัส QR หน้างาน<input aria-label="รหัส QR หน้างาน" value={eventCode} readOnly /></label>
      <label>รหัสคำเชิญ 6 ตัว<input aria-label="รหัสคำเชิญ 6 ตัว" required minLength={6} maxLength={12} autoCapitalize="characters" value={inviteCode} onChange={(event) => setTypedInviteCode(event.target.value.toUpperCase())} /></label>
      {rememberedInviteCode && typedInviteCode === null ? <p className="remembered-invite">พบรหัสคำเชิญจาก browser นี้แล้ว</p> : null}
      <label>จำนวนคนที่มาถึง<input aria-label="จำนวนคนที่มาถึง" type="number" min="1" max="300" value={attendeeCount} onChange={(event) => setAttendeeCount(Number(event.target.value))} /></label>
      <button className="primary-button" disabled={saving}>{saving ? 'กำลังเช็กอิน…' : 'ยืนยันเช็กอิน'}</button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  );
}
