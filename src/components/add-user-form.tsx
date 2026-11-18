'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddUserForm({canAssignAdmin=true}:{canAssignAdmin?:boolean}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), password: String(data.get('password') ?? ''), role: String(data.get('role') ?? 'editor') }) });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(json.error || 'تعذر إنشاء الحساب.'); setBusy(false); return; }
      form.reset(); router.refresh();
    } catch { setError('تعذر الاتصال بالشبكة، حاول مجدداً.'); }
    finally { setBusy(false); }
  }
  return <form className="stack-form" onSubmit={onSubmit}>
    <div className="form-row">
      <label className="field"><span>الاسم</span><input type="text" name="name" required minLength={2} maxLength={120} placeholder="ياسين قاسي" /></label>
      <label className="field"><span>البريد الإلكتروني</span><input type="email" name="email" required placeholder="name@atlasreit.com" /></label>
    </div>
    <div className="form-row">
      <label className="field"><span>كلمة مرور مؤقتة (١٢ حرفاً على الأقل، مع أحرف كبيرة وصغيرة ورقم)</span><input type="password" name="password" required minLength={12} autoComplete="new-password" /></label>
      <label className="field"><span>الدور</span><select name="role" defaultValue="property_staff"><option value="property_staff">موظف عقاري</option><option value="property_manager">مدير عقارات</option><option value="accountant">محاسب</option><option value="general_manager">مدير عام</option><option value="editor">محرر (دور قديم)</option>{canAssignAdmin&&<option value="admin">مدير النظام</option>}</select></label>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'جارٍ الإنشاء…' : 'إضافة عضو للفريق'}</button>
    <p className="field-hint">سلّم بيانات الدخول للعضو بطريقة آمنة واطلب منه تغيير كلمة المرور بعد تسجيل الدخول.</p>
  </form>;
}
