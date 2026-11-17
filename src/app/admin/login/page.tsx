'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandMark } from '@/components/site-header';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || 'Login failed.');
        setBusy(false);
        return;
      }
      const next = params.get('next');
      router.replace(next && next.startsWith('/') ? next : '/admin');
      router.refresh();
    } catch {
      setError('Network error — please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="login-card-wrap">
      <div className="login-card">
        <div className="login-brand">
          <BrandMark size={40} />
          <div>
            <span className="brand-name">
              ATLAS <b>REIT</b>
            </span>
            <p>Staff dashboard</p>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p className="login-sub">Sign in to manage listings and enquiries.</p>

        <form onSubmit={onSubmit} className="login-form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              placeholder="you@atlasreit.com"
              defaultValue=""
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-help">
          Forgot your password? Ask an administrator to reset it from
          Settings → Team accounts.
        </p>
      </div>
    </div>
  );
}
