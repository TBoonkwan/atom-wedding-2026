'use client';

import { useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HostLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    const response = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (response.ok) {
      router.refresh();
      return;
    }
    setMessage(data.error);
  }

  return (
    <main className="host-login-page">
      <form className="host-login-card" onSubmit={submit}>
        <span className="host-logo">NP</span>
        <p>HOST ACCESS</p>
        <h1>Wedding Dashboard</h1>
        <label>Username<input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="host-primary-button" disabled={submitting}><LogIn size={18} /> {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ Dashboard'}</button>
        {message ? <p role="status">{message}</p> : null}
      </form>
    </main>
  );
}
