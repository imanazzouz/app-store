'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandMark } from '@/components/site-header';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword,setShowPassword]=useState(false);

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
        setError(json.error || 'فشل تسجيل الدخول.');
        setBusy(false);
        return;
      }
      const next = params.get('next');
      const safeNext=next&&next.startsWith('/')&&!next.startsWith('//')&&!next.includes('\\')?next:'/admin';
      router.replace(safeNext);
      router.refresh();
    } catch {
      setError('تعذر الاتصال بالشبكة، حاول مجدداً.');
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
            <p>لوحة الموظفين</p>
          </div>
        </div>

        <h1>مرحباً بعودتك</h1>
        <p className="login-sub">سجّل الدخول لإدارة العقارات واستفسارات العملاء.</p>

        <form onSubmit={onSubmit} className="login-form">
          <label className="field">
            <span>البريد الإلكتروني</span>
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
            <span>كلمة المرور</span>
            <div className="password-input-row"><input
              type={showPassword?'text':'password'}
              name="password"
              required
              autoComplete="current-password"
              placeholder="أدخل كلمة المرور"
            /><button type="button" className="btn btn-ghost btn-xs" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{showPassword?'إخفاء':'إظهار'}</button></div>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="login-help">
          هل نسيت كلمة المرور؟ اطلب من المدير إعادة تعيينها من الإعدادات ← حسابات الفريق.
        </p>
      </div>
    </div>
  );
}
