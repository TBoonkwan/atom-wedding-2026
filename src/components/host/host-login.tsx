'use client';

import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';

export function HostLogin() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setMessage(response.ok ? 'ส่งลิงก์เข้า dashboard ไปทางอีเมลแล้ว' : data.error);
  }

  return (
    <main className="host-login-page">
      <form className="host-login-card" onSubmit={submit}>
        <span className="host-logo">NP</span>
        <p>HOST ACCESS</p>
        <h1>Wedding Dashboard</h1>
        <label>อีเมลที่ได้รับอนุญาต<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <button className="host-primary-button"><Mail size={18} /> ส่ง Magic Link</button>
        {message ? <p role="status">{message}</p> : null}
      </form>
    </main>
  );
}
