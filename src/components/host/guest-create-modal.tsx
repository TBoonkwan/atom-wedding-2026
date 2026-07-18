'use client';

import { useState, type FormEvent } from 'react';
import { Plus, XCircle } from 'lucide-react';

export interface ImportedLink {
  displayName: string;
  inviteCode: string;
  token: string;
}

interface GuestCreateModalProps {
  onClose: () => void;
  onCreated: (links: ImportedLink[]) => Promise<void> | void;
}

interface GuestForm {
  displayName: string;
  contactName: string;
  phone: string;
  email: string;
  hostNotes: string;
}

const emptyForm: GuestForm = {
  displayName: '',
  contactName: '',
  phone: '',
  email: '',
  hostNotes: '',
};

export function GuestCreateModal({ onClose, onCreated }: GuestCreateModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof GuestForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/host/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest: form }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.errors?.join(' · ') ?? data.error ?? 'เพิ่มแขกไม่สำเร็จ');
        return;
      }
      await onCreated(data.links ?? []);
      onClose();
    } catch {
      setError('เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="host-modal-backdrop">
      <form className="host-modal" onSubmit={submit}>
        <button
          type="button"
          className="modal-close"
          aria-label="ปิดหน้าต่างเพิ่มแขก"
          disabled={submitting}
          onClick={onClose}
        >
          <XCircle />
        </button>
        <h2>เพิ่มแขก</h2>
        <p className="modal-help">ระบบจะสร้างรหัสและลิงก์เชิญให้ทันทีหลังบันทึก</p>
        <label>
          ชื่อบนคำเชิญ
          <input
            required
            maxLength={160}
            autoFocus
            value={form.displayName}
            onChange={(event) => update('displayName', event.target.value)}
          />
        </label>
        <label>
          ชื่อผู้ติดต่อ
          <input
            required
            maxLength={160}
            value={form.contactName}
            onChange={(event) => update('contactName', event.target.value)}
          />
        </label>
        <label>
          โทรศัพท์
          <input
            type="tel"
            maxLength={40}
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
          />
        </label>
        <label>
          อีเมล
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
          />
        </label>
        <label>
          โน้ต host
          <textarea
            maxLength={500}
            value={form.hostNotes}
            onChange={(event) => update('hostNotes', event.target.value)}
          />
        </label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="host-primary-button" disabled={submitting}>
          <Plus size={17} /> {submitting ? 'กำลังเพิ่มแขก...' : 'เพิ่มแขกและสร้างลิงก์'}
        </button>
      </form>
    </div>
  );
}
