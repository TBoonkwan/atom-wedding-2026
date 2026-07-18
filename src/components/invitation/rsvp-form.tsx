'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Check, Gift, Heart, HelpCircle, X } from 'lucide-react';
import type { PublicInvitation } from '@/lib/services/invitation-service';
import type { BeerPreference, RsvpInput } from '@/lib/domain/types';

const choices = [
  { status: 'accepted' as const, label: 'ไปร่วมงาน', icon: Check },
  { status: 'maybe' as const, label: 'ยังไม่แน่ใจ', icon: HelpCircle },
  { status: 'rejected' as const, label: 'ไปไม่ได้', icon: X },
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
  token: string;
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showGift, setShowGift] = useState(false);

  function setNumber(field: 'adultCount' | 'childCount' | 'childSeatCount', value: string) {
    setInput((current) => ({ ...current, [field]: Number(value) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (input.status !== 'accepted' && !input.reason.trim()) {
      setMessage('กรุณาบอกเหตุผลสั้น ๆ ให้เราทราบ');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'บันทึกไม่สำเร็จ');
      onSaved(data);
      setMessage('บันทึกคำตอบแล้ว ขอบคุณมากนะ 💗');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="rsvp-form" onSubmit={submit}>
      <div className="rsvp-choice-grid" aria-label="เลือกคำตอบ RSVP">
        {choices.map(({ status, label, icon: Icon }) => (
          <button
            type="button"
            key={status}
            className={input.status === status ? 'rsvp-choice active' : 'rsvp-choice'}
            onClick={() => setInput((current) => ({ ...current, status }))}
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
      ) : (
        <div className="form-stack">
          <label>บอกเหตุผลให้เราทราบ<textarea required aria-label="บอกเหตุผลให้เราทราบ" value={input.reason} onChange={(event) => setInput((current) => ({ ...current, reason: event.target.value }))} /></label>
          {input.status === 'rejected' ? (
            <div className="gift-card">
              <Heart size={20} />
              <p>มาไม่ได้ไม่เป็นไร ส่งใจมาแทนก็ได้ 😆</p>
              <button type="button" className="text-button" onClick={() => setShowGift((value) => !value)}>
                <Gift size={16} /> {showGift ? 'ซ่อนซองออนไลน์' : 'เปิดซองออนไลน์ (ไม่บังคับ)'}
              </button>
              {showGift ? (
                <div className="payment-qr" role="img" aria-label="QR ซองออนไลน์">
                  <Image
                    src={`/api/payment-qr/${encodeURIComponent(token)}`}
                    alt="QR ซองออนไลน์"
                    width={360}
                    height={360}
                    unoptimized
                  />
                  <small>ส่งใจมาแทนได้ตามสะดวก ไม่มีการติดตามยอดโอน</small>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? 'กำลังบันทึก…' : 'ยืนยันคำตอบ'}
      </button>
      {message ? <p className="form-message" role="status">{message}</p> : null}
    </form>
  );
}
