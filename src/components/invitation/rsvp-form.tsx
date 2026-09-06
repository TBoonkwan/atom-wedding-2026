'use client';

import { useState, type FormEvent } from 'react';
import { Check, Heart, HelpCircle, X } from 'lucide-react';
import type { PublicInvitation } from '@/lib/services/invitation-service';
import type { BeerPreference, RsvpInput } from '@/lib/domain/types';

const choices = [
  { status: 'accepted' as const, label: 'มา', icon: Check },
  { status: 'maybe' as const, label: 'อาจจะ', icon: HelpCircle },
  { status: 'rejected' as const, label: 'มาไม่ได้', icon: X },
];

const emptyInput: RsvpInput = {
  status: 'accepted',
  adultCount: 2,
  childCount: 0,
  childSeatCount: 0,
  dietaryNotes: '',
  accessibilityNotes: '',
  beerPreference: 'none',
  songRequest: '',
  reason: '',
};

export function RsvpForm({
  token,
  initial,
  onSaved,
}: {
  token?: string;
  initial?: PublicInvitation;
  onSaved: (invitation: PublicInvitation) => void;
}) {
  const [input, setInput] = useState<RsvpInput>(() =>
    initial && initial.status !== 'pending'
      ? {
          status: initial.status,
          adultCount: initial.adultCount,
          childCount: initial.childCount,
          childSeatCount: initial.childSeatCount,
          dietaryNotes: initial.dietaryNotes ?? '',
          accessibilityNotes: initial.accessibilityNotes ?? '',
          beerPreference: initial.beerPreference,
          songRequest: initial.songRequest ?? '',
          reason: initial.reason ?? '',
        }
      : emptyInput,
  );
  const [name, setName] = useState('');
  const [submissionId, setSubmissionId] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function setNumber(field: 'adultCount' | 'childCount' | 'childSeatCount', value: string) {
    setInput((current) => ({ ...current, [field]: Number(value) }));
  }

  function setStatus(status: RsvpInput['status']) {
    setInput((current) => ({
      ...current,
      status,
      reason: status === 'accepted' ? '' : current.reason,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || saved) return;
    const id = submissionId || crypto.randomUUID();
    setSubmissionId(id);
    setSaving(true);
    setMessage('');
    try {
      const payload = input.status === 'accepted'
        ? input
        : {
            ...input,
            adultCount: 0,
            childCount: 0,
            childSeatCount: 0,
            dietaryNotes: '',
            accessibilityNotes: '',
            beerPreference: 'none',
            songRequest: '',
            reason: '',
          };
      const response = await fetch(token ? `/api/invitations/${encodeURIComponent(token)}` : '/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? payload : { ...payload, name, submissionId: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'บันทึกไม่สำเร็จ');
      if (!token) setSaved(true);
      onSaved(data);
      setMessage('บันทึกคำตอบแล้ว ขอบคุณมากนะ 💗');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  if (saved) return <div className="rsvp-summary" role="status"><Heart size={28} /><h3>บันทึกคำตอบแล้ว ขอบคุณมากนะ 💗</h3><p>{name}</p></div>;

  return (
    <form className="rsvp-form" onSubmit={submit}>
      {!token ? <label>ชื่อผู้ตอบรับ<input name="name" autoComplete="name" required maxLength={160} value={name} onChange={event => setName(event.target.value)} /></label> : null}
      <div className="rsvp-choice-grid" aria-label="เลือกคำตอบ RSVP">
        {choices.map(({ status, label, icon: Icon }) => (
          <button
            type="button"
            key={status}
            className={input.status === status ? 'rsvp-choice active' : 'rsvp-choice'}
            aria-pressed={input.status === status}
            onClick={() => setStatus(status)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {input.status === 'accepted' ? (
        <div className="form-stack">
          <div className="number-grid">
            <label>ผู้ใหญ่<input aria-label="ผู้ใหญ่" type="number" min="0" max="300" value={input.adultCount} onChange={(event) => setNumber('adultCount', event.target.value)} /></label>
            <label>เด็ก<input aria-label="เด็ก" type="number" min="0" max="300" value={input.childCount} onChange={(event) => setNumber('childCount', event.target.value)} /></label>
            <label>เก้าอี้เด็ก<input aria-label="เก้าอี้เด็ก" type="number" min="0" max={input.childCount} value={input.childSeatCount} onChange={(event) => setNumber('childSeatCount', event.target.value)} /></label>
          </div>
          <label>คราฟต์เบียร์ที่ชอบ
            <select aria-label="คราฟต์เบียร์ที่ชอบ" value={input.beerPreference} onChange={(event) => setInput((current) => ({ ...current, beerPreference: event.target.value as BeerPreference }))}>
              <option value="none">ไม่ดื่ม / อะไรก็ได้</option>
              <option value="ipa">IPA — หอมฮอปส์</option>
              <option value="lager">Lager — สดชื่น</option>
              <option value="wheat">Wheat — นุ่มผลไม้</option>
            </select>
          </label>
          <label>แพ้อาหารหรือมีข้อจำกัดอะไรไหม<textarea value={input.dietaryNotes} onChange={(event) => setInput((current) => ({ ...current, dietaryNotes: event.target.value }))} /></label>
          <label>ความช่วยเหลือพิเศษ<textarea value={input.accessibilityNotes} onChange={(event) => setInput((current) => ({ ...current, accessibilityNotes: event.target.value }))} /></label>
        </div>
      ) : null}

      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? 'กำลังบันทึก…' : 'ยืนยันคำตอบ'}
      </button>
      {message ? <p className="form-message" role="status">{message}</p> : null}
    </form>
  );
}
