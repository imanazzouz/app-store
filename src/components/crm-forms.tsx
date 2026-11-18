'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Lead } from '@/lib/crm';
import type { Listing } from '@/lib/listings';
import type { ManagedUnit } from '@/lib/assets';
import { LEAD_STAGE_LABELS } from '@/lib/lead-stages';

export function LeadForm({ listings }: { listings: Listing[] }) {
  const router = useRouter(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const values = Object.fromEntries(new FormData(form).entries()); setBusy(true); setError('');
    try { const res = await fetch('/api/admin/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); const data = await res.json().catch(() => ({})) as { error?: string }; if (!res.ok) { setError(data.error || 'تعذر حفظ الملف.'); return; } form.reset(); router.refresh(); }
    catch { setError('تعذر الاتصال بالخادم.'); } finally { setBusy(false); }
  }
  return <form className="stack-form" onSubmit={submit}>
    <div className="form-row"><label className="field"><span>اسم العميل *</span><input name="contact_name" required minLength={2} maxLength={120} /></label><label className="field"><span>البريد الإلكتروني</span><input name="email" type="email" /></label><label className="field"><span>الهاتف</span><input name="phone" maxLength={40} /></label></div>
    <div className="form-row"><label className="field"><span>مصدر العميل</span><select name="source"><option value="manual">إدخال يدوي</option><option value="website">الموقع الإلكتروني</option><option value="phone">الهاتف</option><option value="email">البريد الإلكتروني</option><option value="campaign">حملة تسويقية</option></select></label><label className="field span-2"><span>العقار المطلوب</span><select name="listing_id"><option value="">غير محدد</option>{listings.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.city}</option>)}</select></label></div>
    <label className="field"><span>ملاحظات / طلب العميل</span><textarea name="message" rows={2} maxLength={2000} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'إضافة عميل محتمل'}</button>
  </form>;
}

export function LeadStageControl({ lead }: { lead: Lead }) {
  const router = useRouter(); const [stage, setStage] = useState(lead.stage); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); try { const res = await fetch(`/api/admin/leads/${lead.id}/stage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) }); if (!res.ok) { const data = await res.json().catch(() => ({})) as { error?: string }; alert(data.error || 'تعذر تحديث المرحلة.'); } else router.refresh(); } finally { setBusy(false); } }
  return <form className="row-actions" onSubmit={submit}><select aria-label={`مرحلة ${lead.contact_name}`} value={stage} onChange={(e) => setStage(e.target.value)}>{Object.entries(LEAD_STAGE_LABELS).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select><button className="btn btn-outline btn-xs" disabled={busy || stage === lead.stage}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button></form>;
}

export function VisitForm({ leads, units }: { leads: Lead[]; units: ManagedUnit[] }) {
  const router = useRouter(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (!leads.length) return <p className="empty-note">أضف ملف عميل محتملاً قبل جدولة الزيارة.</p>;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); const localDate = String(data.get('scheduled_at') ?? ''); const unit = String(data.get('unit_id') ?? '');
    setBusy(true); setError('');
    try { const res = await fetch('/api/admin/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: data.get('lead_id'), unit_id: unit || undefined, scheduled_at: new Date(localDate).toISOString(), notes: data.get('notes') }) }); const result = await res.json().catch(() => ({})) as { error?: string }; if (!res.ok) { setError(result.error || 'تعذر جدولة الزيارة.'); return; } form.reset(); router.refresh(); }
    catch { setError('تعذر الاتصال بالخادم.'); } finally { setBusy(false); }
  }
  return <form className="stack-form" onSubmit={submit}><div className="form-row"><label className="field"><span>العميل *</span><select name="lead_id" required>{leads.map((l) => <option key={l.id} value={l.id}>{l.contact_name}</option>)}</select></label><label className="field"><span>الوحدة</span><select name="unit_id"><option value="">غير محددة</option>{units.map((u) => <option key={u.id} value={u.id}>{u.property_name} · {u.code}</option>)}</select></label><label className="field"><span>الموعد *</span><input name="scheduled_at" type="datetime-local" required /></label></div><label className="field"><span>ملاحظات</span><textarea name="notes" rows={2} maxLength={1000} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'جدولة الزيارة'}</button></form>;
}
