'use client';

import { useState } from 'react';

type Props = {
  listingId: number;
  listingTitle: string;
};

type Phase = 'idle' | 'sending' | 'done' | 'error';

export default function EnquiryForm({ listingId, listingTitle }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setPhase('sending');
    setError('');

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          phone: String(data.get('phone') ?? ''),
          message: String(data.get('message') ?? ''),
          company: String(data.get('company') ?? ''),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setPhase('error');
        setError(json.error || 'Something went wrong. Please try again.');
        return;
      }
      setName(String(data.get('name') ?? '').split(' ')[0]);
      setPhase('done');
      form.reset();
    } catch {
      setPhase('error');
      setError('Network error — please check your connection and try again.');
    }
  }

  if (phase === 'done') {
    return (
      <div className="enquiry-card enquiry-success" role="status">
        <div className="success-icon" aria-hidden="true">
          ✓
        </div>
        <h3>Enquiry received</h3>
        <p>
          Thank you{name ? `, ${name}` : ''} — your enquiry for{' '}
          <strong>{listingTitle}</strong> is with our leasing team.
        </p>
        <p className="success-note">
          We’ll reply by email shortly with the full application pack. No
          documents are needed at this stage.
        </p>
      </div>
    );
  }

  return (
    <form className="enquiry-card" onSubmit={onSubmit} noValidate={false}>
      <h3>Enquire about this unit</h3>
      <p className="enquiry-lede">
        Send a short note and we’ll follow up personally with the full
        application pack. <strong>No file uploads required.</strong>
      </p>

      <div className="form-row">
        <label className="field">
          <span>Your name *</span>
          <input
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="Amina Benali"
          />
        </label>
        <label className="field">
          <span>Email *</span>
          <input
            type="email"
            name="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="field">
        <span>Phone (optional)</span>
        <input
          type="tel"
          name="phone"
          maxLength={40}
          autoComplete="tel"
          placeholder="+213 …"
          pattern="[0-9+\s()\-]*"
        />
      </label>

      <label className="field">
        <span>Message (optional)</span>
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Tell us about your timing, intended use, or any questions…"
        />
      </label>

      {/* Honeypot — hidden from humans, tempting for bots */}
      <div className="honeypot" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {phase === 'error' && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={phase === 'sending'}>
        {phase === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
      <p className="form-fineprint">
        Your details are used only to respond to this enquiry.
      </p>
    </form>
  );
}
