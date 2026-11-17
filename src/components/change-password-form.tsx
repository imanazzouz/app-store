'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next = String(data.get('next') ?? '');
    if (next !== String(data.get('confirm') ?? '')) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    setOk(false);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current: String(data.get('current') ?? ''),
          next,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || 'Could not change the password.');
        setBusy(false);
        return;
      }
      setOk(true);
      form.reset();
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Current password</span>
        <input type="password" name="current" required autoComplete="current-password" />
      </label>
      <label className="field">
        <span>New password (min. 8 characters)</span>
        <input type="password" name="next" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="field">
        <span>Repeat new password</span>
        <input type="password" name="confirm" required minLength={8} autoComplete="new-password" />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="form-ok" role="status">
          Password updated ✓
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
