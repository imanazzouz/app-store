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
        setError(json.error || 'حدث خطأ ما. يرجى المحاولة مجدداً.');
        return;
      }
      setName(String(data.get('name') ?? '').split(' ')[0]);
      setPhase('done');
      form.reset();
    } catch {
      setPhase('error');
      setError('تعذر الاتصال بالشبكة. تحقق من اتصالك وحاول مجدداً.');
    }
  }

  if (phase === 'done') {
    return (
      <div className="enquiry-card enquiry-success" role="status">
        <div className="success-icon" aria-hidden="true">
          ✓
        </div>
        <h3>تم استلام استفسارك</h3>
        <p>
          شكراً لك{name ? `، ${name}` : ''} — وصل استفسارك حول{' '}
          <strong>{listingTitle}</strong> is with our leasing team.
        </p>
        <p className="success-note">
          سنتواصل معك قريباً عبر البريد الإلكتروني لمتابعة طلبك. لا حاجة إلى مستندات في هذه المرحلة.
        </p>
      </div>
    );
  }

  return (
    <form className="enquiry-card" onSubmit={onSubmit} noValidate={false}>
      <h3>استفسر عن هذه الوحدة</h3>
      <p className="enquiry-lede">
        أرسل رسالة قصيرة وسيتواصل معك فريقنا لمتابعة الطلب. <strong>لا حاجة إلى رفع ملفات.</strong>
      </p>

      <div className="form-row">
        <label className="field">
          <span>الاسم *</span>
          <input
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="أمينة بن علي"
          />
        </label>
        <label className="field">
          <span>البريد الإلكتروني *</span>
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
        <span>الهاتف (اختياري)</span>
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
        <span>الرسالة (اختياري)</span>
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="أخبرنا عن موعد الانتقال أو طريقة استخدامك للعقار أو أي استفسار…"
        />
      </label>

      {/* Honeypot — hidden from humans, tempting for bots */}
      <div className="honeypot" aria-hidden="true">
        <label>
          الشركة
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {phase === 'error' && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={phase === 'sending'}>
        {phase === 'sending' ? 'جارٍ الإرسال…' : 'إرسال الاستفسار'}
      </button>
      <p className="form-fineprint">
        تُستخدم بياناتك للرد على هذا الاستفسار فقط.
      </p>
    </form>
  );
}
