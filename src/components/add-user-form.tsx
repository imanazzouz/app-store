'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddUserForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
          role: String(data.get('role') ?? 'editor'),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || 'Could not create the account.');
        setBusy(false);
        return;
      }
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
      <div className="form-row">
        <label className="field">
          <span>Name</span>
          <input type="text" name="name" required minLength={2} maxLength={120} placeholder="Yacine Kaci" />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" required placeholder="yacine@atlasreit.com" />
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          <span>Temporary password (min. 8 characters)</span>
          <input type="text" name="password" required minLength={8} autoComplete="off" />
        </label>
        <label className="field">
          <span>Role</span>
          <select name="role" defaultValue="editor">
            <option value="editor">Editor — listings & enquiries</option>
            <option value="admin">Admin — full access incl. accounts</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Creating…' : 'Add team member'}
      </button>
      <p className="field-hint">
        Share the credentials with them, then they can change their own
        password from the panel above.
      </p>
    </form>
  );
}
